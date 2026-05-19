import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client using caller's JWT to verify ownership
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is owner in DB
    const { data: callerRow } = await callerClient
      .from("allowed_admin_emails")
      .select("role")
      .eq("email", caller.email!)
      .maybeSingle();

    if (!callerRow || callerRow.role !== "owner") {
      return new Response(JSON.stringify({ error: "Only owners can manage admin users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for user management
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const method = req.method;

    // ── CREATE user ──────────────────────────────────────────────
    if (method === "POST") {
      const body = await req.json();
      const { email, password, display_name, role } = body as {
        email: string;
        password: string;
        display_name: string;
        role: "owner" | "administrator" | "moderator";
      };

      if (!email || !password || !display_name || !role) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Cannot create another owner via UI — prevent privilege escalation
      if (role === "owner") {
        return new Response(JSON.stringify({ error: "Cannot create owner accounts via UI" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create auth user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upsert into allowed_admin_emails
      const { error: dbError } = await adminClient
        .from("allowed_admin_emails")
        .upsert({
          email,
          display_name,
          role,
          auth_user_id: newUser.user.id,
        }, { onConflict: "email" });

      if (dbError) {
        // Rollback: delete the auth user we just created
        await adminClient.auth.admin.deleteUser(newUser.user.id);
        return new Response(JSON.stringify({ error: dbError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, auth_user_id: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── DELETE user ──────────────────────────────────────────────
    if (method === "DELETE") {
      const body = await req.json();
      const { id, auth_user_id } = body as { id: string; auth_user_id?: string };

      if (!id) {
        return new Response(JSON.stringify({ error: "Missing id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete auth user if we have a reference
      if (auth_user_id) {
        await adminClient.auth.admin.deleteUser(auth_user_id);
      }

      // Delete from allowed_admin_emails
      const { error: dbError } = await adminClient
        .from("allowed_admin_emails")
        .delete()
        .eq("id", id);

      if (dbError) {
        return new Response(JSON.stringify({ error: dbError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── UPDATE role ──────────────────────────────────────────────
    if (method === "PATCH") {
      const body = await req.json();
      const { id, role } = body as { id: string; role: "administrator" | "moderator" };

      if (!id || !role) {
        return new Response(JSON.stringify({ error: "Missing id or role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (role === "owner") {
        return new Response(JSON.stringify({ error: "Cannot promote to owner via UI" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: dbError } = await adminClient
        .from("allowed_admin_emails")
        .update({ role })
        .eq("id", id);

      if (dbError) {
        return new Response(JSON.stringify({ error: dbError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
