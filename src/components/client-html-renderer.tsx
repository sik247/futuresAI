"use client";
import InnerHTML from "dangerously-set-html-content";
import * as htmlparser2 from "htmlparser2";

type TClientHTMLRenderer = {
  html: string;
};

const ClientHTMLRenderer: React.FC<TClientHTMLRenderer> = ({ html }) => {
  type attributes = {
    [key: string]: string;
  };

  type TElement = {
    tag: string;
    attributes?: attributes;
    children: TElement[] | TElement | string;
  };

  function hasAnyTag(html: string) {
    const reg = /<[^>]*>/;
    const match = html.match(reg);
    if (match) {
      return true;
    }
    return false;
  }

  function getElements(html: string): TElement[] {
    const elements: TElement[] = [];
    const parser = new htmlparser2.Parser(
      {
        onopentag(name, attributes) {
          const element: TElement = {
            tag: name,
            attributes,
            children: [],
          };
          if (elements.length === 0) {
            elements.push(element);
          } else {
            const parent = elements[elements.length - 1];
            if (Array.isArray(parent.children)) {
              parent.children.push(element);
            } else {
              parent.children = [element];
            }
          }
          elements.push(element);
        },
        ontext(text) {
          const parent = elements[elements.length - 1];
          if (Array.isArray(parent.children)) {
            parent.children.push({
              tag: "span",
              attributes: {},
              children: text,
            });
          } else {
            parent.children = text;
          }
        },
        onclosetag(name) {
          elements.pop();
        },
      },
      { decodeEntities: true }
    );
    parser.write(html);
    parser.end();
    return elements;
  }

  function isYoutubeLink(link: string) {
    // https://www.youtube.com/watch?v=3s3v3s3
    // https://youtu.be/3s3v3s3
    // https://www.youtube.com/shorts/E-hV85YbLQM
    const reg = /https?:\/\/(www\.)?youtube\.com\/watch\?v=([^\s]+)/;
    const reg2 = /https?:\/\/youtu\.be\/([^\s]+)/;
    const reg3 = /https?:\/\/www\.youtube\.com\/shorts\/([^\s]+)/;
    const match = link.match(reg);
    const match2 = link.match(reg2);
    const match3 = link.match(reg3);
    if (match || match2 || match3) {
      return true;
    }
    return false;
  }

  function isInstagramLink(link: string) {
    const reg = /https?:\/\/www\.instagram\.com\/(p|reel)\/([^\s]+)/;
    const match = link.match(reg);
    if (match) {
      return true;
    }
    return false;
  }

  function getInstagramEmbed(link: string) {
    const reg = /https?:\/\/www\.instagram\.com\/(p|reel)\/([^\/\?]+)/;
    const match = link.match(reg);
    let height = "1220px"; // default height
    if (window.matchMedia("(max-width: 768px)").matches) {
      // if the viewport is 768px or less, set height to 800px
      height = "800px";
    }
    if (match) {
      return `<iframe src="https://www.instagram.com/p/${match[2]}/embed/" allowtransparency="true" allowfullscreen="true" frameborder="0" height="436" data-instgrm-payload-id="instagram-media-payload-0" scrolling="no" style="background-color: white; border-radius: 3px; border: 1px solid rgb(219, 219, 219); box-shadow: none; display: block; margin: 0px 0px 12px; min-width: 326px; width: 100%; height: ${height}; padding: 0px; 
      "></iframe>`;
    }
    return "";
  }

  function getYoutubeVideoId(link: string) {
    const reg = /https?:\/\/(www\.)?youtube\.com\/watch\?v=([^\s]+)/;
    const reg2 = /https?:\/\/youtu\.be\/([^\s]+)/;
    const reg3 = /https?:\/\/www\.youtube\.com\/shorts\/([^\s]+)/;
    const match = link.match(reg);
    const match2 = link.match(reg2);
    const match3 = link.match(reg3);
    if (match) {
      return match[2];
    }
    if (match2) {
      return match2[1];
    }
    if (match3) {
      return match3[1];
    }
    return "";
  }

  function isLegacyImage(link: string) {
    const match = link.includes("https://dongsaroma.com/data");
    if (match) {
      return true;
    }
    return false;
  }

  function changeLegacyImageToNew(link: string) {
    const newLink = link.replace(
      "https://dongsaroma.com/data",
      "/legacy-image"
    );
    return newLink;
  }

  function getYoutubeEmbed(link: string) {
    const videoId = getYoutubeVideoId(link);
    return `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" width="100%" height="550px" style="height:550px;" allowfullscreen="true" allowscriptaccess="always" scrolling="no" frameborder="0"></iframe>`;
  }

  function renderElements(elements: TElement | TElement[] | string): string {
    if (typeof elements === "string") {
      return `<span>${elements}</span>`;
    }
    if (Array.isArray(elements)) {
      let html = "";
      for (let i = 0; i < elements.length; i++) {
        html += renderElements(elements[i]);
      }
      return html;
    }

    let { tag, attributes, children } = elements;
    let embedItem = "";
    if (tag === "a" && attributes?.href !== undefined) {
      attributes = {
        ...attributes,
        target: "_blank",
        style:
          "color: blue; text-decoration: underline; cursor: pointer; text-wrap: wrap; word-break: break-all;",
      };
      const link = attributes.href;
      if (isYoutubeLink(link)) {
        embedItem = getYoutubeEmbed(link);
      }
      if (isInstagramLink(link)) {
        embedItem = getInstagramEmbed(link);
      }
    }
    if (tag === "img" && attributes?.src !== undefined) {
      const link = attributes.src;
      if (isLegacyImage(link)) {
        attributes.src = changeLegacyImageToNew(link);
      }
    }
    let html = "";
    html += `<${tag}`;
    for (const key in attributes) {
      html += ` ${key}="${attributes[key]}"`;
    }
    html += ">";
    if (typeof children === "string") {
      html += children;
    } else {
      html += renderElements(children);
    }
    html += `</${tag}>`;
    html += embedItem;

    return html;
  }

  const hasTag = hasAnyTag(html);

  if (!hasTag && html) {
    return (
      <div className="max-md:text-[14px] prose">
        <InnerHTML html={html} />
      </div>
    );
  }

  const elements = getElements(html);
  let innerHTML = renderElements(elements);

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

  return (
    <>
      {innerHTML && (
        <div className="max-md:text-[14px]" id="container">
          <InnerHTML html={innerHTML} />
        </div>
      )}
    </>
  );
};

export default ClientHTMLRenderer;
