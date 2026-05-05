import { Component } from '@angular/core';
import { StatsWidget } from './components/statswidget';
@Component({
    selector: 'app-dashboard',
    imports: [StatsWidget],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <app-stats-widget class="contents" /> 
        </div>
    `
})

export class Dashboard {}
