import { IPoint } from '../../core/IPoint';
import { SvgHelper } from '../../core/SvgHelper';
import { Settings } from '../../core/Settings';
import { LinearMarkerBase } from '../LinearMarkerBase';
import Icon from './pen-icon.svg';
import { ColorPickerPanel } from '../../ui/toolbox-panels/ColorPickerPanel';
import { ToolboxPanel } from '../../ui/ToolboxPanel';
import { LineWidthPanel } from '../../ui/toolbox-panels/LineWidthPanel';
import { LineStylePanel } from '../../ui/toolbox-panels/LineStylePanel';
import { PenToolState } from './PenToolState';
import { MarkerBaseState } from '../../core/MarkerBaseState';

export class PenTool extends LinearMarkerBase {
  /**
   * String type name of the marker type.
   *
   * Used when adding {@link MarkerArea.availableMarkerTypes} via a string and to save and restore state.
   */
  public static typeName = 'PenTool';

  /**
   * Marker type title (display name) used for accessibility and other attributes.
   */
  public static title = 'Pen Tool';
  /**
   * SVG icon markup displayed on toolbar buttons.
   */
  public static icon = Icon;

  /**
   * Invisible wider curve to make selection easier/possible.
   */
  protected selectorCurve: SVGPathElement;
  /**
   * Visible marker curve.
   */
  protected visibleCurve: SVGPathElement;

  /**
   * Line color.
   */
  protected strokeColor = 'black'; // Changed default line color to black
  /**
   * Line width.
   */
  protected strokeWidth = 2; // Changed default line width to 2
  /**
   * Line dash array.
   */
  protected strokeDasharray = ''; // Removed default dash array

  /**
   * Color picker panel for line color.
   */
  protected strokePanel: ColorPickerPanel;
  /**
   * Line width toolbox panel.
   */
  protected strokeWidthPanel: LineWidthPanel;
  /**
   * Line dash array toolbox panel.
   */
  protected strokeStylePanel: LineStylePanel;

  private points: IPoint[] = [];
  private isDrawing: boolean = false;

  /**
   * Creates a new marker.
   *
   * @param container - SVG container to hold marker's visual.
   * @param overlayContainer - overlay HTML container to hold additional overlay elements while editing.
   * @param settings - settings object containing default markers settings.
   */
  constructor(container: SVGGElement, overlayContainer: HTMLDivElement, settings: Settings) {
    super(container, overlayContainer, settings);

    this.setStrokeColor = this.setStrokeColor.bind(this);
    this.setStrokeWidth = this.setStrokeWidth.bind(this);
    this.setStrokeDasharray = this.setStrokeDasharray.bind(this);
    this.adjustVisual = this.adjustVisual.bind(this);

    this.strokeColor = settings.defaultColor;
    this.strokeWidth = settings.defaultStrokeWidth;

    this.strokePanel = new ColorPickerPanel(
      'Line color',
      settings.defaultColorSet,
      settings.defaultColor
    );
    this.strokePanel.onColorChanged = this.setStrokeColor;

    this.strokeWidthPanel = new LineWidthPanel(
      'Line width',
      settings.defaultStrokeWidths,
      settings.defaultStrokeWidth
    );
    this.strokeWidthPanel.onWidthChanged = this.setStrokeWidth;
  }

  /**
   * Returns true if passed SVG element belongs to the marker. False otherwise.
   *
   * @param el - target element.
   */
  public ownsTarget(el: EventTarget): boolean {
    if (
      super.ownsTarget(el) ||
      el === this.visual ||
      el === this.selectorCurve ||
      el === this.visibleCurve
    ) {
      return true;
    } else {
      return false;
    }
  }

  private getPathD(): string {
    if (this.points.length < 2) {
      return '';
    }
    const path = this.points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    return path;
  }

  private createVisual() {
    this.visual = SvgHelper.createGroup();
    this.visibleCurve = SvgHelper.createPath(
      this.getPathD(),
      [
        ['stroke', this.strokeColor],
        ['stroke-width', this.strokeWidth.toString()],
        ['fill', 'transparent'],
      ]
    );
    this.visual.appendChild(this.visibleCurve);

    this.container.appendChild(this.visual);
  }

  /**
   * Handles pointer (mouse, touch, stylus, etc.) down event.
   *
   * @param point - event coordinates.
   * @param target - direct event target element.
   */
  public pointerDown(point: IPoint, target?: EventTarget): void {
    super.pointerDown(point, target);

    if (!this.isDrawing) {
      this.points = [point];
      this.createVisual();
      this.isDrawing = true;
    }
  }

  /**
   * Handles pointer (mouse, touch, stylus, etc.) move event.
   *
   * @param point - event coordinates.
   */
  public pointerMove(point: IPoint): void {
    if (this.isDrawing) {
      this.points.push(point);
      this.adjustVisual();
    }
  }

  /**
   * Handles pointer (mouse, touch, stylus, etc.) up event.
   *
   * @param point - event coordinates.
   */
  public pointerUp(point: IPoint): void {
    if (this.isDrawing) {
      this.points.push(point);
      this.adjustVisual();
      this.isDrawing = false;
    }
  }

  /**
   * Adjusts visual after manipulation.
   */
  protected adjustVisual(): void {
    if (this.visibleCurve) {
      this.visibleCurve.setAttribute('d', this.getPathD());

      SvgHelper.setAttributes(this.visibleCurve, [['stroke', this.strokeColor]]);
      SvgHelper.setAttributes(this.visibleCurve, [['stroke-width', this.strokeWidth.toString()]]);
    }
  }

  /**
   * Sets line color.
   * @param color - new color.
   */
  protected setStrokeColor(color: string): void {
    this.strokeColor = color;
    this.adjustVisual();
  }
  /**
   * Sets line width.
   * @param width - new width.
   */
  protected setStrokeWidth(width: number): void {
    this.strokeWidth = width;
    this.adjustVisual();
  }

  /**
   * Sets line dash array.
   * @param dasharray - new dash array.
   */
  protected setStrokeDasharray(dasharray: string): void {
    this.strokeDasharray = dasharray;
    this.adjustVisual();
  }

  /**
   * Scales marker. Used after the image resize.
   *
   * @param scaleX - horizontal scale
   * @param scaleY - vertical scale
   */
  public scale(scaleX: number, scaleY: number): void {
    this.points = this.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));
    super.scale(scaleX, scaleY);
    this.adjustVisual();
  }

  /**
   * Returns the list of toolbox panels for this marker type.
   */
  public get toolboxPanels(): ToolboxPanel[] {
    return [this.strokePanel, this.strokeWidthPanel];
  }

  /**
   * Returns current marker state that can be restored in the future.
   */
  public getState(): PenToolState {
    const result: PenToolState = Object.assign({
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      strokeDasharray: this.strokeDasharray,
      points: this.points
    }, super.getState());
    result.typeName = PenTool.typeName;

    return result;
  }

  /**
   * Restores previously saved marker state.
   *
   * @param state - previously saved state.
   */
  public restoreState(state: MarkerBaseState): void {
    super.restoreState(state);

    const penState = state as PenToolState;
    this.strokeColor = penState.strokeColor;
    this.strokeWidth = penState.strokeWidth;
    this.strokeDasharray = penState.strokeDasharray;
    this.points = penState.points;

    this.createVisual();
    this.adjustVisual();
  }
}

