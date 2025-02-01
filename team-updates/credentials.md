# Credential Updates

Track credential changes and required updates across environments.

## Database Credentials

### Replit (Neon Database)

#### 2025-01-03
🔴 **Critical: Database Credentials Expired**

**Status**: Pending Update
**Owner**: Replit Team
**Due**: ASAP

**Issue**:
- Current Neon database credentials have expired
- Sync operations from Replit to Windsurf are failing
- Connection URL needs to be updated

**Required Actions**:
1. Get new connection URL from Replit team
2. Update `REPLIT_DB_URL` in `.env` file
3. Test database connection
4. Run sync process to update Windsurf database

**Technical Details**:
- Current URL pattern: `postgresql://neondb_owner:[password]@[endpoint].neon.tech/neondb`
- Both password and endpoint may change in new URL
- SSL mode must be maintained (`?sslmode=require`)

---

## Credential Rotation Schedule

### Neon Database (Replit)
- Rotation Frequency: As needed (managed by Replit)
- Last Rotation: 2025-01-03
- Next Expected: TBD (await Replit team update)

### Local Development
- Rotation Frequency: Monthly
- Last Rotation: N/A
- Next Scheduled: 2025-02-01
