import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { CryptoPair, Candlestick } from '../types';
import { BarChart2, TrendingUp, Activity, Zap } from 'lucide-react';

interface TradingViewChartProps {
  pair: CryptoPair;
}

export type Timeframe = '1s' | '30s' | '1m' | '5m' | '30m' | '1h' | '1D' | '1W';

const getTimeframeSeconds = (tf: Timeframe): number => {
  switch (tf) {
    case '1s': return 1;
    case '30s': return 30;
    case '1m': return 60;
    case '5m': return 300;
    case '30m': return 1800;
    case '1h': return 3600;
    case '1D': return 86400;
    case '1W': return 604800;
    default: return 60;
  }
};

export const TradingViewChart: React.FC<TradingViewChartProps> = ({ pair }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [activeIndicators, setActiveIndicators] = useState({
    ema: true,
    volume: true,
  });

  const klinesRef = useRef<Candlestick[]>([]);
  const tickCountRef = useRef<number>(0);
  const [tickRate, setTickRate] = useState<number>(0);

  // Measure ticks per second for the live tick monitor
  useEffect(() => {
    const interval = setInterval(() => {
      setTickRate(tickCountRef.current);
      tickCountRef.current = 0;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate historical initial candlestick data for the selected symbol & timeframe
  const generateInitialKlines = (symbol: string, currentPrice: number, tf: Timeframe): Candlestick[] => {
    const klines: Candlestick[] = [];
    const count = tf === '1s' ? 180 : 120;
    const now = Math.floor(Date.now() / 1000);
    const intervalSec = getTimeframeSeconds(tf);

    let price = currentPrice * 0.98;

    for (let i = count; i >= 0; i--) {
      const time = (now - i * intervalSec) as Time;
      const volatilityCoeff = tf === '1s' ? 0.0003 : tf === '30s' ? 0.001 : 0.005;
      const volatility = currentPrice * volatilityCoeff;
      const open = price;
      const change = (Math.random() - 0.48) * volatility;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      const volume = Math.floor(5000 + Math.random() * 50000);

      klines.push({
        time: time as number,
        open: +open.toFixed(pair.precision),
        high: +high.toFixed(pair.precision),
        low: +low.toFixed(pair.precision),
        close: +close.toFixed(pair.precision),
        volume,
      });

      price = close;
    }

    // Ensure latest candle close matches pair.price
    if (klines.length > 0) {
      const last = klines[klines.length - 1];
      last.close = pair.price;
      last.high = Math.max(last.high, pair.price);
      last.low = Math.min(last.low, pair.price);
    }

    return klines;
  };

  // Initialize and render Lightweight Charts
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isLowTimeframe = timeframe === '1s' || timeframe === '30s' || timeframe === '1m';

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 450,
      layout: {
        background: { color: '#0b0e14' },
        textColor: '#8e9aac',
      },
      grid: {
        vertLines: { color: '#161b26' },
        horzLines: { color: '#161b26' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#00F2FE',
          width: 1,
          style: 3,
          labelBackgroundColor: '#00F2FE',
        },
        horzLine: {
          color: '#00F2FE',
          width: 1,
          style: 3,
          labelBackgroundColor: '#00F2FE',
        },
      },
      rightPriceScale: {
        borderColor: '#1e2638',
        scaleMargins: {
          top: 0.1,
          bottom: activeIndicators.volume ? 0.25 : 0.1,
        },
      },
      timeScale: {
        borderColor: '#1e2638',
        timeVisible: true,
        secondsVisible: isLowTimeframe,
      },
    });

    chartRef.current = chart;

    // Add main candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });
    seriesRef.current = candlestickSeries;

    // Add Volume series if enabled
    if (activeIndicators.volume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#1e293b',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      volumeSeriesRef.current = volumeSeries;
    }

    // Generate initial klines
    const initialKlines = generateInitialKlines(pair.symbol, pair.price, timeframe);
    klinesRef.current = initialKlines;

    const formattedCandles: CandlestickData<Time>[] = initialKlines.map(k => ({
      time: k.time as Time,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }));

    candlestickSeries.setData(formattedCandles);

    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(
        initialKlines.map(k => ({
          time: k.time as Time,
          value: k.volume,
          color: k.close >= k.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
        }))
      );
    }

    // Handle container resize safely
    let animationFrameId: number;
    const handleResize = () => {
      animationFrameId = requestAnimationFrame(() => {
        if (chartContainerRef.current && chartRef.current) {
          const width = chartContainerRef.current.clientWidth;
          const height = chartContainerRef.current.clientHeight || 450;
          if (width > 0 && height > 0) {
            try {
              chartRef.current.applyOptions({ width, height });
            } catch {
              // Ignore if chart is disposed
            }
          }
        }
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch {
          // Ignore disposal errors
        }
        chartRef.current = null;
      }
    };
  }, [pair.symbol, timeframe, activeIndicators.volume]);

  // Real-time Tick-by-Tick candlestick stream updates
  useEffect(() => {
    if (!seriesRef.current || klinesRef.current.length === 0) return;

    tickCountRef.current += 1;

    const klines = klinesRef.current;
    const lastCandle = klines[klines.length - 1];
    const now = Math.floor(Date.now() / 1000);
    const intervalSec = getTimeframeSeconds(timeframe);

    // If timeframe period has elapsed, open new candle
    if (now - lastCandle.time >= intervalSec) {
      const newCandle: Candlestick = {
        time: now,
        open: pair.price,
        high: pair.price,
        low: pair.price,
        close: pair.price,
        volume: Math.floor(100 + Math.random() * 500),
      };
      klines.push(newCandle);

      if (klines.length > 300) {
        klines.shift();
      }

      try {
        seriesRef.current.update({
          time: newCandle.time as Time,
          open: newCandle.open,
          high: newCandle.high,
          low: newCandle.low,
          close: newCandle.close,
        });

        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: newCandle.time as Time,
            value: newCandle.volume,
            color: 'rgba(16, 185, 129, 0.3)',
          });
        }
      } catch {
        seriesRef.current = null;
      }
    } else {
      // Update existing current candle in tick-by-tick real time
      const updatedLast: Candlestick = {
        ...lastCandle,
        close: pair.price,
        high: Math.max(lastCandle.high, pair.price),
        low: Math.min(lastCandle.low, pair.price),
        volume: lastCandle.volume + Math.floor(Math.random() * 10 + 1),
      };

      klines[klines.length - 1] = updatedLast;

      try {
        seriesRef.current.update({
          time: updatedLast.time as Time,
          open: updatedLast.open,
          high: updatedLast.high,
          low: updatedLast.low,
          close: updatedLast.close,
        });

        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: updatedLast.time as Time,
            value: updatedLast.volume,
            color: updatedLast.close >= updatedLast.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
          });
        }
      } catch {
        seriesRef.current = null;
      }
    }
  }, [pair.price, timeframe]);

  const timeframeOptions: { id: Timeframe; label: string; title: string }[] = [
    { id: '1s', label: '1s', title: 'Tick / 1 Detik' },
    { id: '30s', label: '30s', title: '30 Detik' },
    { id: '1m', label: '1m', title: '1 Menit' },
    { id: '5m', label: '5m', title: '5 Menit' },
    { id: '30m', label: '30m', title: '30 Menit' },
    { id: '1h', label: '1h', title: '1 Jam' },
    { id: '1D', label: '1D', title: '1 Hari' },
    { id: '1W', label: '1W', title: '1 Minggu' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] border border-[#1b2232] rounded-xl overflow-hidden shadow-xl">
      {/* Chart Control Toolbar (Low Timeframe & Indicators & Tick Monitor) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#10141d] border-b border-[#1b2232] text-xs">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#00F2FE]" /> Timeframe:
          </span>
          {timeframeOptions.map(tf => (
            <button
              key={tf.id}
              title={tf.title}
              onClick={() => setTimeframe(tf.id)}
              className={`px-2 py-1 rounded font-bold text-[11px] transition-all flex items-center gap-1 ${
                timeframe === tf.id
                  ? 'bg-cyan-500/20 text-[#00F2FE] border border-cyan-500/50 shadow-[0_0_8px_rgba(0,242,254,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tf.label}
              {tf.id === '1s' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
            </button>
          ))}
        </div>

        {/* Live Tick Data Indicator & Indicators Toggle */}
        <div className="flex items-center gap-2">
          {/* Real-time Tick-by-Tick Badge */}
          <div className="flex items-center gap-1.5 bg-[#171f30] border border-emerald-500/30 px-2 py-1 rounded text-[10px] font-mono font-bold text-emerald-400">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Tick-by-Tick:</span>
            <span>{tickRate > 0 ? `${tickRate} t/s` : 'Real-Time'}</span>
          </div>

          <button
            onClick={() => setActiveIndicators(prev => ({ ...prev, volume: !prev.volume }))}
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
              activeIndicators.volume ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-500/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Vol
          </button>

          <button
            onClick={() => setActiveIndicators(prev => ({ ...prev, ema: !prev.ema }))}
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
              activeIndicators.ema ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> EMA
          </button>
        </div>
      </div>

      {/* Main Lightweight-Charts Container */}
      <div className="relative flex-1 w-full min-h-[380px] lg:min-h-[460px]" ref={chartContainerRef}>
        {/* Floating Live Watermark & Overhead Price Info */}
        <div className="absolute top-3 left-4 z-10 pointer-events-none flex items-center gap-2 sm:gap-3 bg-[#0e121b]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#20293c]">
          <span className="font-extrabold text-sm text-white">{pair.symbol}</span>
          <span className="font-mono text-xs text-slate-300">
            O: {klinesRef.current.slice(-1)[0]?.open || pair.price}
          </span>
          <span className="font-mono text-xs text-emerald-400">
            H: {klinesRef.current.slice(-1)[0]?.high || pair.high24h}
          </span>
          <span className="font-mono text-xs text-rose-400">
            L: {klinesRef.current.slice(-1)[0]?.low || pair.low24h}
          </span>
          <span className="font-mono text-xs text-[#00F2FE] font-bold">
            C: {pair.price}
          </span>
        </div>
      </div>
    </div>
  );
};

