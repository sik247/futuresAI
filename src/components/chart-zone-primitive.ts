import type {
  ISeriesPrimitive,
  ISeriesApi,
  SeriesType,
  Time,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  SeriesAttachedParameter,
  Coordinate,
} from "lightweight-charts";

type CanvasTarget = {
  useBitmapCoordinateSpace(
    callback: (scope: {
      context: CanvasRenderingContext2D;
      mediaSize: { width: number; height: number };
      bitmapSize: { width: number; height: number };
      horizontalPixelRatio: number;
      verticalPixelRatio: number;
    }) => void
  ): void;
};

export interface ZoneConfig {
  topPrice: number;
  bottomPrice: number;
  color: string;
}

class ZoneRenderer implements IPrimitivePaneRenderer {
  private _topY: Coordinate | null = null;
  private _bottomY: Coordinate | null = null;
  private _color: string;

  constructor(color: string) {
    this._color = color;
  }

  update(topY: Coordinate | null, bottomY: Coordinate | null) {
    this._topY = topY;
    this._bottomY = bottomY;
  }

  draw(target: CanvasTarget) {
    if (this._topY === null || this._bottomY === null) return;

    target.useBitmapCoordinateSpace((scope) => {
      const { context: ctx, bitmapSize, verticalPixelRatio } = scope;
      const top = Math.min(this._topY!, this._bottomY!) * verticalPixelRatio;
      const bottom = Math.max(this._topY!, this._bottomY!) * verticalPixelRatio;
      const height = bottom - top;

      if (height <= 0) return;

      ctx.fillStyle = this._color;
      ctx.fillRect(0, top, bitmapSize.width, height);
    });
  }
}

class ZonePaneView implements IPrimitivePaneView {
  private _renderer: ZoneRenderer;

  constructor(color: string) {
    this._renderer = new ZoneRenderer(color);
  }

  update(topY: Coordinate | null, bottomY: Coordinate | null) {
    this._renderer.update(topY, bottomY);
  }

  zOrder(): "bottom" {
    return "bottom";
  }

  renderer(): IPrimitivePaneRenderer {
    return this._renderer as unknown as IPrimitivePaneRenderer;
  }
}

export class RectangleZone implements ISeriesPrimitive<Time> {
  private _config: ZoneConfig;
  private _series: ISeriesApi<SeriesType, Time> | null = null;
  private _paneView: ZonePaneView;
  private _requestUpdate: (() => void) | null = null;

  constructor(config: ZoneConfig) {
    this._config = config;
    this._paneView = new ZonePaneView(config.color);
  }

  attached(param: SeriesAttachedParameter<Time, SeriesType>) {
    this._series = param.series;
    this._requestUpdate = param.requestUpdate;
    this.updateAllViews();
  }

  detached() {
    this._series = null;
    this._requestUpdate = null;
  }

  updateAllViews() {
    if (!this._series) return;
    const topY = this._series.priceToCoordinate(this._config.topPrice);
    const bottomY = this._series.priceToCoordinate(this._config.bottomPrice);
    this._paneView.update(topY, bottomY);
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this._paneView];
  }
}
