"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dictionary } from "@/i18n";
import gsap from "gsap";

type ChartIdeaData = {
  id: string;
  imageUrl: string;
  pair: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  description: string;
  createdAt: string | Date;
  user: {
    id: string;
    nickname: string;
    imageUrl: string;
  };
};

type TChartIdeaCard = {
  idea: ChartIdeaData;
  index: number;
  translations: Dictionary;
};

const ChartIdeaCard: React.FC<TChartIdeaCard> = ({
  idea,
  index,
  translations,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // GSAP entrance animation
  useEffect(() => {
    if (!cardRef.current) return;

    gsap.fromTo(
      cardRef.current,
      {
        opacity: 0,
        y: 40,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        delay: index * 0.08,
        ease: "power3.out",
      }
    );
  }, [index]);

  // Draw annotated chart thumbnail
  const drawAnnotatedChart = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imgRef.current;

    if (!canvas || !ctx || !img) return;

    const width = canvas.clientWidth;
    const aspectRatio = img.naturalHeight / img.naturalWidth;
    const height = width * aspectRatio;

    canvas.width = width * 2; // retina
    canvas.height = height * 2;
    canvas.style.height = `${height}px`;
    ctx.scale(2, 2);

    ctx.drawImage(img, 0, 0, width, height);

    // Draw subtle overlay gradient at bottom
    const gradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, []);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      drawAnnotatedChart();
    };
    img.src = idea.imageUrl;
  }, [idea.imageUrl, drawAnnotatedChart]);

  const riskReward =
    Math.abs(idea.takeProfit - idea.entryPrice) /
    Math.abs(idea.entryPrice - idea.stopLoss);

  const isLong = idea.direction === "LONG";
  const formattedDate = new Date(idea.createdAt).toLocaleDateString();

  return (
    <div ref={cardRef} style={{ opacity: 0 }}>
      <Card className="group overflow-hidden bg-zinc-950/60 backdrop-blur-sm border-white/[0.08] hover:border-white/20 transition-all duration-500 hover:shadow-xl hover:shadow-black/20">
        {/* Chart Image */}
        <div className="relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full block"
          />
          {/* Pair badge */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge className="bg-zinc-900/80 backdrop-blur-sm border-white/10 text-white font-mono text-xs">
              {idea.pair}
            </Badge>
            <Badge
              className={`backdrop-blur-sm border-0 text-xs font-semibold ${
                isLong
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {isLong ? translations.chartIdeas_long : translations.chartIdeas_short}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3">
          {/* Price levels */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-blue-400 font-medium">
                {translations.chartIdeas_entry}
              </span>
              <span className="text-white font-mono">
                {idea.entryPrice.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-red-400 font-medium">
                {translations.chartIdeas_stopLoss}
              </span>
              <span className="text-white font-mono">
                {idea.stopLoss.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-green-400 font-medium">
                {translations.chartIdeas_takeProfit}
              </span>
              <span className="text-white font-mono">
                {idea.takeProfit.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* R:R ratio bar */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500">
              {translations.chartIdeas_riskReward}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                style={{
                  width: `${Math.min((riskReward / 5) * 100, 100)}%`,
                }}
              />
            </div>
            <span className="text-[11px] text-white font-mono font-bold">
              1:{riskReward.toFixed(1)}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
            {idea.description}
          </p>

          {/* Author + Date */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <img
                src={idea.user.imageUrl}
                alt={idea.user.nickname}
                className="w-6 h-6 rounded-full object-cover border border-white/10"
              />
              <span className="text-xs text-zinc-400">
                {idea.user.nickname}
              </span>
            </div>
            <span className="text-[11px] text-zinc-600">{formattedDate}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChartIdeaCard;
export type { ChartIdeaData };
