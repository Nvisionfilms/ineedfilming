import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, DollarSign, Target } from "lucide-react";

const ROICalculator = () => {
  const [currentRevenue, setCurrentRevenue] = useState([100000]);
  const [conversionIncrease, setConversionIncrease] = useState([25]);

  const calculateROI = () => {
    const investmentLow = 3500;
    const investmentHigh = 12000;
    const revenueIncrease = currentRevenue[0] * (conversionIncrease[0] / 100);
    const roiLow = ((revenueIncrease - investmentLow) / investmentLow) * 100;
    const roiHigh = ((revenueIncrease - investmentHigh) / investmentHigh) * 100;

    // Check if scenario is viable (positive ROI for high-end package)
    const isViableScenario = revenueIncrease > investmentHigh;

    return {
      revenueIncrease,
      roiLow,
      roiHigh,
      breakEven: revenueIncrease > 0 ? Math.ceil((investmentLow / revenueIncrease) * 12) : 0,
      isViableScenario,
    };
  };

  const results = calculateROI();

  return (
    <section className="py-20 bg-gradient-to-br from-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Calculate Your <span className="text-primary">Potential ROI</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how a founder story video could impact your business growth
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Investment Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <label className="text-sm font-medium mb-4 block">
                Current Annual Revenue: ${currentRevenue[0].toLocaleString()}
              </label>
              <Slider
                value={currentRevenue}
                onValueChange={setCurrentRevenue}
                min={50000}
                max={1000000}
                step={10000}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-4 block">
                Expected Conversion Increase: {conversionIncrease[0]}%
              </label>
              <Slider
                value={conversionIncrease}
                onValueChange={setConversionIncrease}
                min={20}
                max={50}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Industry average for founder story videos: 20-35%
              </p>
            </div>

            {!results.isViableScenario && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  ⚠️ Increase your revenue goal or conversion rate for viable ROI scenarios
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6 pt-6 border-t">
              <div className="text-center p-6 bg-primary/5 rounded-lg">
                <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-primary mb-1">
                  ${results.revenueIncrease.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Potential Revenue Increase</div>
              </div>

              <div className="text-center p-6 bg-primary/5 rounded-lg">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                {results.isViableScenario ? (
                  <>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {results.roiLow.toFixed(0)}% - {results.roiHigh.toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Return on Investment</div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-semibold text-muted-foreground mb-1">
                      Adjust Settings
                    </div>
                    <div className="text-xs text-muted-foreground">For positive ROI</div>
                  </>
                )}
              </div>

              <div className="text-center p-6 bg-primary/5 rounded-lg">
                <Target className="w-8 h-8 text-primary mx-auto mb-2" />
                {results.isViableScenario && results.breakEven > 0 ? (
                  <>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {results.breakEven} {results.breakEven === 1 ? "month" : "months"}
                    </div>
                    <div className="text-sm text-muted-foreground">Break-Even Timeline</div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-semibold text-muted-foreground mb-1">
                      N/A
                    </div>
                    <div className="text-xs text-muted-foreground">Adjust parameters</div>
                  </>
                )}
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Recommended Marketing Budget
                </h3>
                <p className="text-sm text-amber-600 dark:text-amber-500 mb-4 font-medium">
                  ⚠️ Estimated based on current scope, which is always changing
                </p>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-background/50 rounded-lg p-4 border">
                    <div className="text-sm text-muted-foreground mb-1">Monthly Budget</div>
                    <div className="text-2xl font-bold text-primary">
                      ${Math.round(currentRevenue[0] * 0.07 / 12).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Conservative (7% of revenue)</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4 border">
                    <div className="text-sm text-muted-foreground mb-1">Monthly Budget</div>
                    <div className="text-2xl font-bold text-primary">
                      ${Math.round(currentRevenue[0] * 0.10 / 12).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Moderate (10% of revenue)</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4 border">
                    <div className="text-sm text-muted-foreground mb-1">Monthly Budget</div>
                    <div className="text-2xl font-bold text-primary">
                      ${Math.round(currentRevenue[0] * 0.15 / 12).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Aggressive (15% of revenue)</div>
                  </div>
                </div>
                <div className="text-center py-6 bg-background/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-4">
                    These estimates help guide your marketing investment strategy
                  </p>
                  <button 
                    onClick={() => document.getElementById('lead-capture')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Get Your Custom Budget Plan
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Based on actual client results and industry benchmarks
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ROICalculator;
