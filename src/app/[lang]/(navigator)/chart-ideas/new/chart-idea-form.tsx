"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploadModule } from "@/lib/modules/file-upload";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import ChartAnnotationCanvas, {
  type LineType,
  type AnnotationLine,
} from "../chart-annotation-canvas";
import { createChartIdeaAction } from "../actions";
import { toast } from "@/components/ui/use-toast";
import { Dictionary } from "@/i18n";

const POPULAR_PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "BNB/USDT",
  "SOL/USDT",
  "XRP/USDT",
  "DOGE/USDT",
  "ADA/USDT",
  "AVAX/USDT",
  "DOT/USDT",
  "MATIC/USDT",
  "LINK/USDT",
  "UNI/USDT",
];

const formSchema = z.object({
  imageUrl: z.string().min(1, "Chart screenshot is required"),
  pair: z.string().min(1, "Trading pair is required"),
  direction: z.enum(["LONG", "SHORT"]),
  entryPrice: z.number().positive("Entry price must be positive"),
  stopLoss: z.number().positive("Stop loss must be positive"),
  takeProfit: z.number().positive("Take profit must be positive"),
  description: z.string().min(1, "Description is required"),
});

type FormValues = z.infer<typeof formSchema>;

type TChartIdeaForm = {
  lang: string;
  translations: Dictionary;
};

const ChartIdeaForm: React.FC<TChartIdeaForm> = ({ lang, translations }) => {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTool, setActiveTool] = useState<LineType | null>(null);
  const [lines, setLines] = useState<AnnotationLine[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageUrl: "",
      pair: "BTC/USDT",
      direction: "LONG",
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      description: "",
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "File size must be less than 10MB",
      });
      return;
    }

    setUploading(true);
    try {
      const fileUploader = new FileUploadModule();
      const data = await fileUploader.upload(file);
      const fileUrl =
        "https://nkkuehjtdudabogzwibw.supabase.co/storage/v1/object/public/CryptoX/" +
        data.path;
      form.setValue("imageUrl", fileUrl);
      setImagePreview(fileUrl);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLinePlaced = (type: LineType, yPercent: number) => {
    setLines((prev) => {
      const filtered = prev.filter((l) => l.type !== type);
      return [...filtered, { type, y: yPercent }];
    });
    // Auto-advance to next tool
    if (type === "entry") setActiveTool("stopLoss");
    else if (type === "stopLoss") setActiveTool("takeProfit");
    else setActiveTool(null);
  };

  const toolButtons: { type: LineType; label: string; color: string }[] = [
    { type: "entry", label: translations.chartIdeas_entry, color: "bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30" },
    { type: "stopLoss", label: translations.chartIdeas_stopLoss, color: "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30" },
    { type: "takeProfit", label: translations.chartIdeas_takeProfit, color: "bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30" },
  ];

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    try {
      const response = await createChartIdeaAction(data);

      if (response.serverError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create chart idea.",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Chart idea shared successfully!",
      });
      router.push(`/${lang}/chart-ideas`);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-8 py-12 w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-4xl max-md:text-2xl text-foreground">
            {translations.chartIdeas_new}
          </h1>
        </div>

        {/* Image Upload + Annotation */}
        <Card className="p-6 bg-zinc-950/50 backdrop-blur-sm border-white/10">
          {!imagePreview ? (
            <FormField
              control={form.control}
              name="imageUrl"
              render={() => (
                <FormItem>
                  <FormControl>
                    <label
                      htmlFor="chart-upload"
                      className="flex flex-col items-center justify-center gap-4 p-16 rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 transition-colors cursor-pointer"
                    >
                      <input
                        type="file"
                        id="chart-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                      <CloudArrowUpIcon className="w-12 h-12 text-zinc-500" />
                      <span className="text-zinc-400 text-lg">
                        {uploading ? "Uploading..." : translations.chartIdeas_upload}
                      </span>
                      <span className="text-zinc-600 text-sm">
                        PNG, JPG up to 10MB
                      </span>
                    </label>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {/* Annotation tools */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-zinc-400">
                  {translations.chartIdeas_annotate}:
                </span>
                {toolButtons.map(({ type, label, color }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setActiveTool(activeTool === type ? null : type)
                    }
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-all ${color} ${
                      activeTool === type
                        ? "ring-2 ring-offset-1 ring-offset-zinc-950"
                        : ""
                    } ${
                      lines.find((l) => l.type === type)
                        ? "opacity-100"
                        : "opacity-70"
                    }`}
                  >
                    {label}
                    {lines.find((l) => l.type === type) && " \u2713"}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setLines([]);
                    form.setValue("imageUrl", "");
                    setActiveTool(null);
                  }}
                  className="ml-auto px-3 py-1.5 rounded-md text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 transition-all"
                >
                  Replace Image
                </button>
              </div>

              {/* Canvas */}
              <ChartAnnotationCanvas
                imageUrl={imagePreview}
                lines={lines}
                activeTool={activeTool}
                onLinePlace={handleLinePlaced}
                entryLabel={translations.chartIdeas_entry}
                stopLossLabel={translations.chartIdeas_stopLoss}
                takeProfitLabel={translations.chartIdeas_takeProfit}
              />
            </div>
          )}
        </Card>

        {/* Trade Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pair */}
          <FormField
            control={form.control}
            name="pair"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">
                  {translations.chartIdeas_pair}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-zinc-950/50 border-white/10">
                      <SelectValue placeholder="Select pair" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {POPULAR_PAIRS.map((pair) => (
                      <SelectItem key={pair} value={pair}>
                        {pair}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Direction */}
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">
                  {translations.chartIdeas_direction}
                </FormLabel>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => field.onChange("LONG")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                      field.value === "LONG"
                        ? "bg-green-500/20 border-green-500/50 text-green-400 shadow-lg shadow-green-500/10"
                        : "bg-zinc-900/50 border-white/10 text-zinc-500 hover:border-white/20"
                    }`}
                  >
                    {translations.chartIdeas_long}
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange("SHORT")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                      field.value === "SHORT"
                        ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-lg shadow-red-500/10"
                        : "bg-zinc-900/50 border-white/10 text-zinc-500 hover:border-white/20"
                    }`}
                  >
                    {translations.chartIdeas_short}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Price Levels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="entryPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-blue-400">
                  {translations.chartIdeas_entry}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    className="bg-zinc-950/50 border-blue-500/30 focus:border-blue-500"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stopLoss"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-red-400">
                  {translations.chartIdeas_stopLoss}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    className="bg-zinc-950/50 border-red-500/30 focus:border-red-500"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="takeProfit"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-green-400">
                  {translations.chartIdeas_takeProfit}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    className="bg-zinc-950/50 border-green-500/30 focus:border-green-500"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Risk/Reward Display */}
        {form.watch("entryPrice") > 0 &&
          form.watch("stopLoss") > 0 &&
          form.watch("takeProfit") > 0 && (
            <Card className="p-4 bg-zinc-950/50 backdrop-blur-sm border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">
                  {translations.chartIdeas_riskReward}
                </span>
                <span className="text-white font-mono font-bold">
                  1 :{" "}
                  {(
                    Math.abs(form.watch("takeProfit") - form.watch("entryPrice")) /
                    Math.abs(form.watch("entryPrice") - form.watch("stopLoss"))
                  ).toFixed(2)}
                </span>
              </div>
            </Card>
          )}

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">
                {translations.chartIdeas_description}
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder={translations.chartIdeas_description}
                  className="bg-zinc-950/50 border-white/10 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 transition-all"
          >
            {submitting ? "..." : translations.chartIdeas_submit}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ChartIdeaForm;
