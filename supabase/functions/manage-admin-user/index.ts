import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller with their own JWT
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is owner
    const { data: callerRow } = await callerClient
      .from("allowed_admin_emails")
      .select("role")
      .eq("email", caller.email)
      .maybeSingle();

    if (!callerRow || callerRow.role !== "owner") {
      return new Response(JSON.stringify({ error: "Only owners can manage admins" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const method = req.method.toUpperCase();

    if (method === "POST") {
      const { email, password, display_name, role } = await req.json();
      if (!email || !password || !display_name || !role) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (role === "owner") {
        return new Response(JSON.stringify({ error: "Cannot create owner via UI" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error: signUpError } = await adminClient.auth.admin.createUser({
        email, password, email_confirm: true,
      });
      if (signUpError) {
        return new Response(JSON.stringify({ error: signUpError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: insertError } = await adminClient
        .from("allowed_admin_emails")
        .insert({ email, display_name, role, auth_user_id: data.user.id });
      if (insertError) {
        await adminClient.auth.admin.deleteUser(data.user.id);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (method === "PATCH") {
      const { id, role } = await req.json();
      if (!id || !role) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (role === "owner") {
        return new Response(JSON.stringify({ error: "Cannot promote to owner via UI" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await adminClient.from("allowed_admin_emails").update({ role }).eq("id", id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (method === "DELETE") {
      const { id, auth_user_id } = await req.json();
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing id" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: deleteError } = await adminClient.from("allowed_admin_emails").delete().eq("id", id);
      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (auth_user_id) {
        await adminClient.auth.admin.deleteUser(auth_user_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
