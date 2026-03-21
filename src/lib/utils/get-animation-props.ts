type TFade = "up" | "down" | "left" | "right" | "fade";

export const getAnimationProps = (
  type?: TFade,
  duration?: number,
  delay?: number
) => {
  return {
    "data-aos": getFadeDirection(type),
    "data-aos-easing": "ease-out",
    "data-aos-duration": duration || 500,
    "data-aos-delay": delay || 100,
  };
};

function getFadeDirection(type?: TFade) {
  switch (type) {
    case "up":
      return "fade-up";
    case "down":
      return "fade-down";
    case "left":
      return "fade-left";
    case "right":
      return "fade-right";
    case "fade":
      return "fade";
    default:
      return "fade";
  }
}
