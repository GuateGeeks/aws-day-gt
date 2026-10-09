import type { ChallengeOption } from "../../../shared/challenges/types";
import { AwsServiceIcon } from "./awsServiceIcons";
import "./service-decision.css";

type Props = { options: readonly ChallengeOption[]; selected: string | null; onSelect: (id: string) => void; disabled?: boolean };

export function ServiceDecisionScene({ options, selected, onSelect, disabled = false }: Props) {
  return <div className="service-decision" role="group" aria-label="Elige un servicio AWS">
    {options.map((option) => <button key={option.id} type="button" className={`service-decision__option${selected === option.id ? " is-selected" : ""}`} onClick={() => onSelect(option.id)} aria-pressed={selected === option.id} disabled={disabled}>
      <AwsServiceIcon id={option.id} />
      <span>{option.label}</span>
      <span className="service-decision__indicator" aria-hidden="true" />
    </button>)}
  </div>;
}
