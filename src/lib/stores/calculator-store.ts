import { Exchange } from "@prisma/client";
import { create } from "zustand";

interface IExchange extends Exchange {}

interface ICalculatorStore {
  selectedExchange: IExchange;
  setSelectedExchange: (selectedExchange: IExchange) => void;
  seed: number;
  setSeed: (seed: number) => void;
  leverage: number;
  setLeverage: (leverage: number) => void;
  frequency: number;
  setFrequency: (frequency: number) => void;
  frequencyText: string;
  setFrequencyText: (frequencyText: string) => void;
  expectationPayback: number;
  setExpectationPayback: (expectationPayback: number) => void;
}

export const useCalculatorStore = create<ICalculatorStore>((set) => {
  return {
    selectedExchange: {
      id: "",
      name: "",
      imageUrl: "",
      titleImageUrl: "",
      limitFee: 0,
      marketFee: 0,
      type: "",
      link: "",
      tag: "",
      averageIncome: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      discountRatio: 0,
      paybackRatio: 0,
    },
    setSelectedExchange: (selectedExchange) => set({ selectedExchange }),
    seed: 0,
    setSeed: (seed) => set({ seed }),
    leverage: 0,
    setLeverage: (leverage) => set({ leverage }),
    frequency: 0,
    setFrequency: (frequency) => set({ frequency }),
    frequencyText: "",
    setFrequencyText: (frequencyText) => set({ frequencyText }),
    expectationPayback: 0,
    setExpectationPayback: (expectationPayback) => set({ expectationPayback }),
  };
});
