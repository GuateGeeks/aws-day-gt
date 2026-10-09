import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ServiceDecisionScene } from "../../src/features/challenges/ServiceDecisionScene";

afterEach(cleanup);

describe("AWS service selection", () => {
  it("shows a flat, accessible choice without a 3D canvas", async () => {
    function Example() {
      const [selected, setSelected] = useState<string | null>(null);
      return <ServiceDecisionScene options={[{ id: "sqs", label: "Amazon SQS" }, { id: "sns", label: "Amazon SNS" }, { id: "cloudwatch", label: "Amazon CloudWatch" }]} selected={selected} onSelect={setSelected} />;
    }
    render(<Example />);
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Elige un servicio AWS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Amazon SNS" }).querySelector("img")).toHaveAttribute("src", "/aws-services/sns.svg");
    await userEvent.click(screen.getByRole("button", { name: "Amazon SQS" }));
    expect(screen.getByRole("button", { name: "Amazon SQS" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Amazon SNS" })).toHaveAttribute("aria-pressed", "false");
  });
});
