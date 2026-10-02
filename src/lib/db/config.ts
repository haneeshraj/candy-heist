// Where the database is, read from the environment: `.env.local` in
// development, the host's settings once deployed. Never in the code, so a
// public repository gives nothing away.
//
//   MONGODB_URI   the Atlas connection string, with its user and password
//   MONGODB_DB    candy_heist_dev in development, candy_heist_prod when live

export interface DbConfig {
  uri: string;
  name: string;
}

/** The database's settings, or null while either is missing. */
export function readDbConfig(
  env: Record<string, string | undefined>
): DbConfig | null {
  const uri = env.MONGODB_URI?.trim();
  const name = env.MONGODB_DB?.trim();
  return uri && name ? { uri, name } : null;
}
