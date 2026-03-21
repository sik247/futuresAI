import { cn } from "@/lib/utils";
import React from "react";

const Chart = ({
  item,
}: {
  item: {
    id: string;
    title: string;
    caption: string;
    chartHeight: string;
    type: string;
  };
}) => {
  return (
    <div className="flex flex-col justify-end text-center h-full mx-4">
      <span className="md:text-sm text-xs ">{item.title}</span>
      <div
        className={cn(
          `mx-auto rounded-lg h-${item.chartHeight} ${
            item.type === "HIGH" ? "bg-foreground" : "bg-muted-foreground"
          } md:w-8 w-6 my-4`
        )}
      ></div>
      <span
        className={`md:text-sm text-xs ${
          item.type === "HIGH" ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {item.caption}
      </span>
    </div>
  );
};

export default Chart;
