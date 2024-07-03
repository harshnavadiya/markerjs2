import { IPoint } from '../../core/IPoint';
import { LinearMarkerBaseState } from '../LinearMarkerBaseState';

export interface PenToolState extends LinearMarkerBaseState {
  strokeColor: string;
  strokeWidth: number;
  // strokeDasharray: string;
  points: IPoint[];
}
