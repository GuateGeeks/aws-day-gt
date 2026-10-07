import { awsInterests, experienceLevels, primaryRoles, type ChallengeProfile } from "../../../shared/challenges/profile";
import { Field } from "../../design-system/components";

export type ChallengeProfileDraft = Omit<ChallengeProfile, "primaryRole" | "experienceLevel" | "firstAwsCommunityDay"> & {
  primaryRole: ChallengeProfile["primaryRole"] | "";
  experienceLevel: ChallengeProfile["experienceLevel"] | "";
  firstAwsCommunityDay: boolean | null;
};

export const emptyChallengeProfile: ChallengeProfileDraft = {
  primaryRole: "", experienceLevel: "", firstAwsCommunityDay: null, awsInterest: []
};

export function ChallengeProfileFields({ value, onChange }: { value: ChallengeProfileDraft; onChange: (next: ChallengeProfileDraft) => void }) {
  return <div className="stack">
    <Field id="primary-role" label="Tu área principal"><select className="ds-input" id="primary-role" required value={value.primaryRole} onChange={(event) => onChange({ ...value, primaryRole: event.target.value as ChallengeProfile["primaryRole"] })}><option value="">Selecciona tu área</option>{primaryRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select></Field>
    <Field id="experience-level" label="Tu nivel de experiencia"><select className="ds-input" id="experience-level" required value={value.experienceLevel} onChange={(event) => onChange({ ...value, experienceLevel: event.target.value as ChallengeProfile["experienceLevel"] })}><option value="">Selecciona tu nivel</option>{experienceLevels.map((level) => <option key={level} value={level}>{level}</option>)}</select></Field>
    <Field id="first-aws-day" label="¿Es tu primer AWS Community Day?"><select className="ds-input" id="first-aws-day" required value={value.firstAwsCommunityDay === null ? "" : String(value.firstAwsCommunityDay)} onChange={(event) => onChange({ ...value, firstAwsCommunityDay: event.target.value === "true" })}><option value="">Selecciona una respuesta</option><option value="true">Sí</option><option value="false">No</option></select></Field>
    <div className="stack"><strong>Intereses AWS (hasta 4)</strong><div className="interest-grid">{awsInterests.map((interest) => <label className="check-tile" key={interest}><input type="checkbox" checked={value.awsInterest.includes(interest)} onChange={() => onChange({ ...value, awsInterest: value.awsInterest.includes(interest) ? value.awsInterest.filter((item) => item !== interest) : value.awsInterest.length < 4 ? [...value.awsInterest, interest] : value.awsInterest })} />{interest}</label>)}</div></div>
  </div>;
}
