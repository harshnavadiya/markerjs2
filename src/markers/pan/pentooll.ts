import { IPoint } from '../../core/IPoint';
import { SvgHelper } from '../../core/SvgHelper';
import { Settings } from '../../core/Settings';
import { LinearMarkerBase } from '../LinearMarkerBase';
import Icon from './pen-icon.svg';
import { ColorPickerPanel } from '../../ui/toolbox-panels/ColorPickerPanel';
import { LineWidthPanel } from '../../ui/toolbox-panels/LineWidthPanel';
import { PenToolState } from './PenToolState';
import { MarkerBaseState } from '../../core/MarkerBaseState';
import { ToolboxPanel } from '../../ui/ToolboxPanel';

export class PenTool extends LinearMarkerBase {
  public static typeName = 'PenTool';
  public static title = 'Pen Tool';
  public static icon = Icon;

  protected visibleCurve: SVGPathElement;
  protected strokeColor = 'black';
  protected strokeWidth = 2;

  protected strokePanel: ColorPickerPanel;
  protected strokeWidthPanel: LineWidthPanel;

  private points: IPoint[] = [];
  private drawingPath: SVGPathElement;
  private isDrawing = false;

  constructor(
    container: SVGGElement,
    overlayContainer: HTMLDivElement,
    settings: Settings
  ) {
    super(container, overlayContainer, settings);

    this.strokeColor = settings.defaultColor;
    this.strokeWidth = settings.defaultStrokeWidth;

    this.strokePanel = new ColorPickerPanel(
      'Line color',
      settings.defaultColorSet,
      settings.defaultColor
    );
    this.strokePanel.onColorChanged = this.setStrokeColor.bind(this);

    this.strokeWidthPanel = new LineWidthPanel(
      'Line width',
      settings.defaultStrokeWidths,
      settings.defaultStrokeWidth
    );
    this.strokeWidthPanel.onWidthChanged = this.setStrokeWidth.bind(this);
  }

  public ownsTarget(el: EventTarget): boolean {
    return (
      super.ownsTarget(el) ||
      el === this.visual ||
      el === this.visibleCurve ||
      el === this.drawingPath
    );
  }

  private createVisual(): void {
    this.visual = SvgHelper.createGroup();

    this.visibleCurve = SvgHelper.createPath('', [
      ['stroke', this.strokeColor],
      ['stroke-width', this.strokeWidth.toString()],
      ['fill', 'transparent'],
    ]);
    this.visual.appendChild(this.visibleCurve);

    this.drawingPath = SvgHelper.createPath('', [
      ['stroke', this.strokeColor],
      ['stroke-width', this.strokeWidth.toString()],
      ['fill', 'transparent'],
    ]);
    this.visual.appendChild(this.drawingPath);

    for (let i = 0; i < this.points.length; i++) {
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );
      circle.setAttribute('cx', this.points[i].x.toString());
      circle.setAttribute('cy', this.points[i].y.toString());
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', 'white');
      circle.setAttribute('stroke', 'gray');
      circle.setAttribute('cursor', 'pointer');
      circle.addEventListener('mousedown', (event) => {
        event.stopPropagation();
        this.adjustPoint(i); // Pass the index of the clicked circle
      });
      this.visual.appendChild(circle);
    }

    this.container.appendChild(this.visual);
  }

  public pointerDown(point: IPoint, target?: EventTarget): void {
    super.pointerDown(point, target);

    if (!this.isDrawing) {
      this.points.push(point);
      this.createVisual();
      this.isDrawing = true;
    }
  }

  public pointerMove(point: IPoint): void {
    if (this.isDrawing) {
      this.points.push(point);
      this.adjustVisual();
    }
  }

  public pointerUp(point: IPoint): void {
    if (this.isDrawing) {
      this.points.push(point);
      this.adjustVisual();
      this.isDrawing = false;
    }
  }

  protected adjustVisual(): void {
    if (this.visibleCurve && this.drawingPath) {
      this.visibleCurve.setAttribute('d', this.getPathD());
      this.drawingPath.setAttribute('d', this.getPathD());

      for (let i = 0; i < this.points.length; i++) {
        const circle = this.visual.childNodes[i + 2] as SVGElement;
        if (circle instanceof SVGElement) {
          circle.setAttribute('cx', this.points[i].x.toString());
          circle.setAttribute('cy', this.points[i].y.toString());
        }
      }
    }
  }

  protected adjustPoint(index: number): void {
    console.log(
      `Adjusting point ${index}: (${this.points[index].x}, ${this.points[index].y})`
    );

    // Ensure index is within bounds
    if (index >= 0 && index < this.points.length) {
      // Implement logic to adjust the point based on user interaction
      // For example, move the point to a new position
      const newPointX = this.points[index].x + 10; // Adjust as needed
      const newPointY = this.points[index].y + 10; // Adjust as needed
      this.points[index] = { x: newPointX, y: newPointY };

      // Update the visual representation
      this.adjustVisual();
    }
  }

  protected setStrokeColor(color: string): void {
    this.strokeColor = color;
    this.adjustVisual();
  }

  protected setStrokeWidth(width: number): void {
    this.strokeWidth = width;
    this.adjustVisual();
  }

  public get toolboxPanels(): ToolboxPanel[] {
    return [this.strokePanel, this.strokeWidthPanel];
  }

  public getState(): PenToolState {
    const result: PenToolState = {
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      points: this.points,
      ...super.getState(),
    };
    result.typeName = PenTool.typeName;

    return result;
  }

  public restoreState(state: MarkerBaseState): void {
    super.restoreState(state);

    const penState = state as PenToolState;
    this.strokeColor = penState.strokeColor;
    this.strokeWidth = penState.strokeWidth;
    this.points = penState.points;

    this.createVisual();
    this.adjustVisual();
  }

  private getPathD(): string {
    if (this.points.length < 2) {
      return '';
    }

    let path = `M ${this.points[0].x} ${this.points[0].y}`;
    for (let i = 1; i < this.points.length - 1; i++) {
      // For each pair of points, calculate the control points for a smooth curve
      const xc = (this.points[i].x + this.points[i + 1].x) / 2;
      const yc = (this.points[i].y + this.points[i + 1].y) / 2;
      path += ` Q ${this.points[i].x} ${this.points[i].y} ${xc} ${yc}`;
    }

    // Draw the last line segment
    path += ` L ${this.points[this.points.length - 1].x} ${this.points[this.points.length - 1].y}`;

    return path;
  }

  public scale(scaleX: number, scaleY: number): void {
    for (let i = 0; i < this.points.length; i++) {
      this.points[i].x *= scaleX;
      this.points[i].y *= scaleY;
    }
    this.adjustVisual();
  }
}
