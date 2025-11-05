# Pipeline Enhancement Implementation Guide

Due to the size of the AdminPipeline component, I'm providing the key code snippets to add to your existing file.

## 1. ADD IMPORTS (at top of AdminPipeline.tsx)

```typescript
import { 
  calculateLeadScore, 
  getLeadGrade, 
  getLeadGradeColor, 
  getLeadGradeIcon,
  getDaysInStageColor,
  isOpportunityStale,
  calculatePipelineMetrics,
  calculateForecast
} from "@/lib/crm-utils";
import { formatDistanceToNow, differenceInDays, isBefore } from "date-fns";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, TrendingUp, AlertCircle, Clock } from "lucide-react";
```

## 2. ADD STATE FOR METRICS (after existing useState)

```typescript
const [metrics, setMetrics] = useState<any>(null);
const [forecast, setForecast] = useState<any>(null);
const [showMetrics, setShowMetrics] = useState(true);
```

## 3. UPDATE loadOpportunities FUNCTION

```typescript
const loadOpportunities = async () => {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });

  if (!error && data) {
    setOpportunities(data);
    
    // Calculate metrics
    const pipelineMetrics = calculatePipelineMetrics(data);
    setMetrics(pipelineMetrics);
    
    // Calculate forecast
    const forecastData = calculateForecast(data, 1);
    setForecast(forecastData);
  }
};
```

## 4. ADD METRICS DASHBOARD (before the pipeline columns)

```tsx
{showMetrics && metrics && (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    {/* Total Pipeline Value */}
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Total Pipeline Value
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${metrics.totalValue.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Weighted: ${metrics.weightedValue.toLocaleString()}
        </p>
      </CardContent>
    </Card>

    {/* Win Rate */}
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Win Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {metrics.conversionRates.overallWinRate.toFixed(1)}%
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Avg Deal: ${metrics.avgDealSize.toLocaleString()}
        </p>
      </CardContent>
    </Card>

    {/* Hot Leads */}
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Hot Leads 🔥
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-500">
          {metrics.hotCount}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Grade A opportunities
        </p>
      </CardContent>
    </Card>

    {/* Stale Opportunities */}
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Needs Follow-up
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-orange-500">
          {metrics.staleCount}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Stale opportunities
        </p>
      </CardContent>
    </Card>
  </div>
)}

{forecast && (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Revenue Forecast - {forecast.month}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Conservative</p>
          <p className="text-xl font-bold text-green-600">
            ${forecast.conservative.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">75% probability</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Likely</p>
          <p className="text-xl font-bold text-blue-600">
            ${forecast.likely.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">50% probability</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Optimistic</p>
          <p className="text-xl font-bold text-purple-600">
            ${forecast.optimistic.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">25% probability</p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

## 5. ENHANCE OPPORTUNITY CARD (replace existing card content)

```tsx
<Card 
  key={opp.id} 
  className={cn(
    "cursor-move hover:shadow-lg transition-shadow",
    isOpportunityStale(new Date(opp.last_activity_at || opp.updated_at), opp.stage) && "border-orange-500 border-2"
  )}
  draggable
  onDragStart={() => handleDragStart(opp)}
>
  <CardContent className="p-4">
    {/* Header with Lead Grade */}
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold">{opp.contact_name}</h3>
          {opp.lead_grade && (
            <Badge className={getLeadGradeColor(opp.lead_grade)}>
              {getLeadGradeIcon(opp.lead_grade)} {opp.lead_grade}
            </Badge>
          )}
        </div>
        {opp.company && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Building className="w-3 h-3" />
            {opp.company}
          </p>
        )}
      </div>
      
      {/* Quick Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => {
            setSelectedOpportunity(opp);
            setIsMeetingDialogOpen(true);
          }}>
            <CalendarIcon className="w-4 h-4 mr-2" />
            Schedule Meeting
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.location.href = `mailto:${opp.contact_email}`}>
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDeleteOpportunity(opp.id)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    {/* Budget */}
    {opp.budget_max && (
      <div className="flex items-center gap-2 text-sm mb-2">
        <DollarSign className="w-4 h-4 text-green-600" />
        <span className="font-semibold text-green-600">
          ${opp.budget_max.toLocaleString()}
        </span>
      </div>
    )}

    {/* Days in Stage */}
    {opp.days_in_stage !== undefined && (
      <div className={cn(
        "flex items-center gap-2 text-xs mb-2",
        getDaysInStageColor(opp.days_in_stage)
      )}>
        <Clock className="w-3 h-3" />
        {opp.days_in_stage} days in stage
      </div>
    )}

    {/* Last Activity */}
    <div className="text-xs text-muted-foreground mb-2">
      Last activity: {formatDistanceToNow(new Date(opp.last_activity_at || opp.updated_at))} ago
    </div>

    {/* Stale Warning */}
    {isOpportunityStale(new Date(opp.last_activity_at || opp.updated_at), opp.stage) && (
      <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded mt-2">
        <AlertCircle className="w-3 h-3" />
        Needs follow-up!
      </div>
    )}

    {/* Expected Close Date */}
    {opp.expected_close_date && (
      <div className={cn(
        "text-xs mt-2",
        isBefore(new Date(opp.expected_close_date), new Date()) ? "text-red-500" : "text-muted-foreground"
      )}>
        Close: {format(new Date(opp.expected_close_date), 'MMM d, yyyy')}
        {isBefore(new Date(opp.expected_close_date), new Date()) && " (Overdue)"}
      </div>
    )}

    {/* Service Type */}
    {opp.service_type && (
      <div className="text-xs text-muted-foreground mt-2 truncate">
        {opp.service_type}
      </div>
    )}
  </CardContent>
</Card>
```

## 6. ADD FUNCTION TO UPDATE STAGE (add this function)

```typescript
const updateStageWithActivity = async (id: string, newStage: string) => {
  // Optimistic update
  setOpportunities(prev => 
    prev.map(opp => opp.id === id ? { ...opp, stage: newStage } : opp)
  );

  const { error } = await supabase
    .from("opportunities")
    .update({ 
      stage: newStage,
      stage_changed_at: new Date().toISOString(),
      days_in_stage: 0
    })
    .eq("id", id);

  if (error) {
    toast({ 
      title: "Error updating stage", 
      description: error.message, 
      variant: "destructive" 
    });
    loadOpportunities();
  } else {
    // Log activity
    await supabase.from("opportunity_activities").insert({
      opportunity_id: id,
      activity_type: 'stage_change',
      description: `Stage changed to ${stages.find(s => s.id === newStage)?.label}`,
    });
    
    toast({ title: "Stage updated successfully" });
    loadOpportunities();
  }
};
```

## 7. REPLACE updateStage CALLS

Replace all calls to `updateStage` with `updateStageWithActivity`

## DEPLOYMENT STEPS:

1. ✅ Run `ENHANCE_CRM_SCHEMA.sql` in Supabase
2. ✅ Create `lib/crm-utils.ts` file
3. ✅ Add imports to AdminPipeline.tsx
4. ✅ Add state variables
5. ✅ Update loadOpportunities function
6. ✅ Add metrics dashboard JSX
7. ✅ Enhance opportunity card JSX
8. ✅ Add updateStageWithActivity function
9. ✅ Replace updateStage calls
10. ✅ Test thoroughly
11. ✅ Commit and deploy

This gives you:
- 🔥 Lead scoring with A-D grades
- ⏰ Days in stage tracking
- 📊 Pipeline metrics dashboard
- 💰 Revenue forecasting
- ⚠️ Stale opportunity alerts
- 📅 Quick action menus
- 📈 Conversion rate tracking

All integrated seamlessly with your existing pipeline!
