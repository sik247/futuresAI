"use client";

import InnerHTML from "dangerously-set-html-content";

import { useEffect, useState } from "react";

import { getElements, hasAnyTag, renderElements } from "./get-html";

type TTwitterHTMLRenderer = {
  html: string;
};

const TwitterHTMLRenderer: React.FC<TTwitterHTMLRenderer> = ({ html }) => {
  const [innerHTML, setInnerHTML] = useState<string>("");
  // const hasTag = await hasAnyTag(html);

  useEffect(() => {
    hasAnyTag(html).then((res) => {
      if (!res) {
        setInnerHTML(html);
        return;
      }
      const fetchData = async () => {
        const elements = await getElements(html);
        let innerHTML = await renderElements(elements);
        const styles = `
    <style>
      .max-md:text-[14px] {
        font-size: 14px;
      }
      #container p {
        min-height: 24px;

      }
      #container span {
        min-height: 24px;
      }
    </style>
  `;

        innerHTML = styles + innerHTML;
        setInnerHTML(innerHTML);
      };
      fetchData();
    });
  }, []);

  return (
    <>
      {innerHTML ? (
        <div className="max-md:text-[14px]" id="container">
          <InnerHTML html={innerHTML} />
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </>
  );
};

export default TwitterHTMLRenderer;
