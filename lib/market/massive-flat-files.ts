import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.MASSIVE_S3_ENDPOINT ?? "https://files.massive.com";
const bucket = process.env.MASSIVE_S3_BUCKET ?? "flatfiles";

function getClient() {
  const accessKeyId = process.env.MASSIVE_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.MASSIVE_S3_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Massive Flat Files S3 credentials are not configured.");
  }
  return new S3Client({
    endpoint,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/** Verifies historical-data access without exposing credentials or downloading a large dataset. */
export async function getMassiveFlatFilesStatus() {
  const client = getClient();
  const response = await client.send(new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: "us_stocks_sip/",
    MaxKeys: 1,
  }));
  return {
    source: "massive-flat-files",
    connected: true,
    scope: "historical-bulk-data",
    endpoint,
    bucket,
    sampleObjectAvailable: Boolean(response.Contents?.length),
  };
}
