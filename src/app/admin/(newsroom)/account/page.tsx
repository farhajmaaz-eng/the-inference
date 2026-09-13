import { requireAdmin } from "@/lib/auth";
import { ManagedForm } from "@/components/admin/forms";
import { changePasswordAction } from "@/app/admin/actions";
export default async function AccountPage() {
  const { user } = await requireAdmin();
  return (
    <>
      <div className="admin-title">
        <h1>Your newsroom account</h1>
      </div>
      <p className="muted">
        Signed in as {user.email}. Replace temporary credentials before launch.
      </p>
      <ManagedForm action={changePasswordAction} label="Change password">
        <section className="form-section">
          <div className="form-grid">
            <label className="field">
              Current password
              <input
                type="password"
                name="current_password"
                required
                autoComplete="current-password"
                maxLength={200}
              />
            </label>
            <label className="field">
              New password
              <input
                type="password"
                name="new_password"
                required
                autoComplete="new-password"
                minLength={12}
                maxLength={200}
              />
              <small>Use at least 12 characters and a unique password.</small>
            </label>
          </div>
        </section>
      </ManagedForm>
    </>
  );
}
