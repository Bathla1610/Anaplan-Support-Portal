module.exports = async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ message: "Method Not Allowed" });

  const token   = process.env.VITE_ADO_TOKEN;
  const org     = process.env.VITE_ADO_ORG;
  const project = process.env.VITE_ADO_PROJECT;

  // 🔍 Debug check — tells you immediately if env vars are missing
  if (!token || !org || !project) {
    return res.status(500).json({
      message: `Missing env vars — token:${!!token} org:${!!org} project:${!!project}`
    });
  }

  const { workItemType = "Issue", apiVersion = "7.1" } = req.query;

  const adoUrl =
    `https://dev.azure.com/${encodeURIComponent(org)}/` +
    `${encodeURIComponent(project)}/_apis/wit/workitems/` +
    `$${workItemType}?api-version=${apiVersion}`;

  const encoded = Buffer.from(`:${token}`).toString("base64");

  try {
    const adoRes = await fetch(adoUrl, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json-patch+json",
        "Authorization": `Basic ${encoded}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await adoRes.json();
    return res.status(adoRes.status).json(data);

  } catch (err) {
    return res.status(500).json({ message: `ADO call failed: ${err.message}` });
  }
};