import { Component } from '@angular/core';
import {PageBreadcrumb} from '@app/components/page-breadcrumb';
import {statistics} from '@/app/shared/views/dashboards/marketing/data';
import {StatisticCard} from '@/app/shared/views/dashboards/marketing/components/statistic-card';
import {LiveFeeds} from '@/app/shared/views/dashboards/marketing/components/live-feeds';
import {ReturningTarget} from '@/app/shared/views/dashboards/marketing/components/returning-target';
import {EfficiencyMetrics} from '@/app/shared/views/dashboards/marketing/components/efficiency-metrics';
import {StatisticWithChart} from '@/app/shared/views/dashboards/marketing/components/statistic-with-chart';
import {SalesPerformance} from '@/app/shared/views/dashboards/marketing/components/sales-performance';

@Component({
  selector: 'app-marketing',
  imports: [
    PageBreadcrumb,
    StatisticCard,
    LiveFeeds,
    ReturningTarget,
    EfficiencyMetrics,
    StatisticWithChart,
    SalesPerformance
  ],
  templateUrl: './marketing.html',
  styles: ``
})
export class Marketing {

  protected readonly statistics = statistics;
}
