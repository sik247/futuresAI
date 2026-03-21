"use client";

import React, { useEffect } from "react";
import TwitterHTMLRenderer from "./twitter-html-renderer";
import ClientHTMLRenderer from "./client-html-renderer";

type THTMLRenderer = {
  html: string;
  renderMode: "text" | "comment";
};

const HTMLRenderer: React.FC<THTMLRenderer> = ({ html, renderMode }) => {
  const [mode, setMode] = React.useState<"client" | "twitter" | "loading">(
    "loading"
  );
  useEffect(() => {
    async function isTwitterLink(link: string) {
      // https://x.com/yeww0912/status/1768911130330874166?s=20
      // https://twitter.com/heunghacnayo/status/1768814222262391129?t=z7BVA5C7tRMPKn5a-vBf-Q&s=19
      // https://twitter.com/catchefff/status/1768871023494209743?t=xxo5woCAobTUHy5tb4NBNA&s=19
      // https://twitter.com/Reza_Zadeh/status/1344009123004747778?ref_src=twsrc%5Etfw%7Ctwcamp%5Etweetembed%7Ctwterm%5E1344009123004747778%7Ctwgr%5E78743380d27d5fe2908813f1f73795b06761b765%7Ctwcon%5Es1_&ref_url=https%3A%2F%2Fiframely.net%2FCFRzKmU%3Fapp%3D1demo%3D1

      const reg = /https?:\/\/twitter\.com\/[^\s]+\/status\/([^\s]+)/;
      // x is new name of twitter
      const reg2 = /https?:\/\/x\.com\/[^\s]+\/status\/([^\s]+)/;
      const reg3 =
        /https?:\/\/twitter\.com\/[^\s]+\/status\/([^\s]+)\?t=[^\s]+/;
      const match = link.match(reg);
      const match2 = link.match(reg2);
      const match3 = link.match(reg3);
      if (match || match2 || match3) {
        return true;
      }
      return false;
    }
    isTwitterLink(html).then((result) => {
      setMode(result ? "twitter" : "client");
    });
  }, []);

  if (mode === "loading") {
    return <div>Loading...</div>;
  }

  if (mode === "twitter") {
    return <TwitterHTMLRenderer html={html} />;
  }

  return <ClientHTMLRenderer html={html} />;
};

export default HTMLRenderer;
