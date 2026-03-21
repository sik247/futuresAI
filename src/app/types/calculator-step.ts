import { Dispatch, SetStateAction } from "react";

export type StepName =
  | "chooseExchange"
  | "entrySeed"
  | "leverage"
  | "frequency"
  | "expectationPayback"
  | "result";

export type StepComponentProps = {
  goToStep: (stepName: StepName) => void;
  setProgress: Dispatch<SetStateAction<number>>;
};
