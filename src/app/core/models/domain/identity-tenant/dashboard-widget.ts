import { WidgetPosition } from './widget-position';
import { WidgetSize } from './widget-size';

export interface DashboardWidget {
  widgetId: string;
  position: WidgetPosition;
  size: WidgetSize;
  isVisible: boolean;
}
