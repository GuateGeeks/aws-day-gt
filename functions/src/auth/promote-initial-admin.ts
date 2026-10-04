import { getAuth } from "firebase-admin/auth";
import { auth } from "firebase-functions/v1";
import { INITIAL_ADMIN_EMAIL } from "../../../shared/constants";
import { refs } from "../shared/refs";

export const promoteInitialAdmin = auth.user().onCreate(async (user) => {
  if (user.email?.trim().toLowerCase() !== INITIAL_ADMIN_EMAIL) return;
  await getAuth().setCustomUserClaims(user.uid, { role: "admin" });
  await refs.user(user.uid).set({ role: "admin", email: user.email.toLowerCase() }, { merge: true });
});
