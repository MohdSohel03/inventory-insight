import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    let recipientEmail: string | undefined;
    let triggerProduct: { product_name?: string; stock_quantity?: number; threshold?: number } | null = null;

    // Parse body
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // no body
    }

    // Check if this is an automated trigger call (service role) or manual (user token)
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const token = authHeader?.replace("Bearer ", "");
    const isServiceCall = token === serviceRoleKey;

    if (isServiceCall) {
      // Automated trigger - get product info from body
      triggerProduct = body as typeof triggerProduct;
      // Send to all admin users
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles && adminRoles.length > 0) {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const adminEmails = (users || [])
          .filter((u) => adminRoles.some((r) => r.user_id === u.id))
          .map((u) => u.email)
          .filter(Boolean) as string[];
        recipientEmail = adminEmails[0]; // Send to first admin
      }
    } else {
      // Manual call - verify user
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: claims, error: claimsError } = await anonClient.auth.getUser();
      if (claimsError || !claims.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      recipientEmail = (body?.email as string) || claims.user.email;
    }

    if (!recipientEmail) {
      throw new Error("No recipient email found");
    }

    // Fetch low-stock products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("name, sku, stock_quantity, low_stock_threshold")
      .order("stock_quantity", { ascending: true });

    if (productsError) throw productsError;

    const lowStock = (products || []).filter(
      (p) => p.stock_quantity <= p.low_stock_threshold
    );

    if (lowStock.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No low-stock items found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email HTML
    const rows = lowStock
      .map(
        (p) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${p.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${p.sku || "—"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:${p.stock_quantity === 0 ? "#dc2626" : "#f59e0b"};font-weight:600;">
            ${p.stock_quantity}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${p.low_stock_threshold}</td>
        </tr>`
      )
      .join("");

    const triggerNote = triggerProduct?.product_name
      ? `<p style="color:#d97706;font-weight:600;">🔔 Triggered by: "${triggerProduct.product_name}" dropping to ${triggerProduct.stock_quantity} units</p>`
      : "";

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1a1a1a;">⚠️ Low Stock Alert</h2>
        ${triggerNote}
        <p style="color:#555;">${lowStock.length} product(s) need attention:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:8px 12px;text-align:left;">Product</th>
              <th style="padding:8px 12px;text-align:left;">SKU</th>
              <th style="padding:8px 12px;text-align:left;">Current Stock</th>
              <th style="padding:8px 12px;text-align:left;">Threshold</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#888;font-size:12px;">Sent from InventoryPro</p>
      </div>
    `;

    const subject = triggerProduct?.product_name
      ? `⚠️ Low Stock: "${triggerProduct.product_name}" dropped to ${triggerProduct.stock_quantity} units`
      : `⚠️ Low Stock Alert: ${lowStock.length} product(s) need attention`;

    // Send email via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "InventoryPro <onboarding@resend.dev>",
        to: [recipientEmail],
        subject,
        html,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      throw new Error(`Resend API error [${resendRes.status}]: ${JSON.stringify(resendData)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Alert sent for ${lowStock.length} product(s)`,
        emailId: resendData.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Low stock alert error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
