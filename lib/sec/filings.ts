export type Filing = {
  accessionNumber: string;
  form: string;
  filingDate: string;
  reportDate: string | null;
  primaryDocument: string;
  documentUrl: string;
};

type SecSubmission = {
  cik: string;
  filings?: {
    recent?: {
      accessionNumber: string[];
      form: string[];
      filingDate: string[];
      reportDate: string[];
      primaryDocument: string[];
    };
  };
};

function requiredUserAgent() {
  const userAgent = process.env.SEC_USER_AGENT;
  if (!userAgent) throw new Error("SEC_USER_AGENT must identify Atlas Terminal and a support email.");
  return userAgent;
}

export async function getRecentFilings(cik: string, limit = 20): Promise<Filing[]> {
  const paddedCik = cik.replace(/\D/g, "").padStart(10, "0");
  if (!/^\d{10}$/.test(paddedCik)) throw new Error("A valid CIK is required.");

  const response = await fetch(`https://data.sec.gov/submissions/CIK${paddedCik}.json`, {
    headers: { "User-Agent": requiredUserAgent(), "Accept-Encoding": "gzip, deflate" },
    next: { revalidate: 3600 }
  });
  if (!response.ok) throw new Error(`SEC filing request failed with ${response.status}.`);

  const data = (await response.json()) as SecSubmission;
  const recent = data.filings?.recent;
  if (!recent) return [];
  return recent.accessionNumber.slice(0, limit).map((accessionNumber, index) => {
    const compactAccession = accessionNumber.replaceAll("-", "");
    const primaryDocument = recent.primaryDocument[index];
    return {
      accessionNumber,
      form: recent.form[index],
      filingDate: recent.filingDate[index],
      reportDate: recent.reportDate[index] || null,
      primaryDocument,
      documentUrl: `https://www.sec.gov/Archives/edgar/data/${Number(data.cik)}/${compactAccession}/${primaryDocument}`
    };
  });
}
