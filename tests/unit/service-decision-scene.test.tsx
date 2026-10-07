import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ServiceDecisionScene } from "../../src/features/challenges/ServiceDecisionScene";

afterEach(cleanup);

describe("3D AWS service selection", () => {
  it("keeps an accessible choice when WebGL is unavailable", async () => {
    function Example() {
      const [selected, setSelected] = useState<string | null>(null);
      return <ServiceDecisionScene options={[{ id: "sqs", label: "Amazon SQS" }, { id: "sns", label: "Amazon SNS" }, { id: "cloudwatch", label: "Amazon CloudWatch" }]} selected={selected} onSelect={setSelected} />;
    }
    render(<Example />);
    await userEvent.click(screen.getByRole("button", { name: "Amazon SQS" }));
    expect(screen.getByRole("button", { name: "Amazon SQS" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Amazon SNS" })).toHaveAttribute("aria-pressed", "false");
  });
});
