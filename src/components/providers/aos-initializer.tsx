"use client";
import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
type TAosInitializer = {};

const AosInitializer: React.FC<TAosInitializer> = ({}) => {
  useEffect(() => {
    AOS.init();
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(function () {
        AOS.refresh();
      }, 500);
    });
  }, []);
  return <></>;
};

export default AosInitializer;
