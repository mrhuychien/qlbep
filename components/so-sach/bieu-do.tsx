'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ngayNgan, tien, tienNgan } from '@/lib/format';
import { Card } from '@/components/ui/card';

const TRUC = { fontSize: 11, fill: '#78716C' };
const CAM = '#EA580C';
const XANH = '#16A34A';
const DO = '#DC2626';

function KhungBieuDo({
  tieuDe,
  moTa,
  trong,
  children,
}: {
  tieuDe: string;
  moTa?: string;
  trong: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-1 p-3">
      <h3 className="text-sm font-bold">{tieuDe}</h3>
      {moTa && <p className="text-xs text-muted-foreground">{moTa}</p>}
      {trong ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chưa có số liệu trong kỳ này.</p>
      ) : (
        <div className="h-56 w-full">{children}</div>
      )}
    </Card>
  );
}

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid #E7E5E4',
    fontSize: 12,
    fontFamily: 'inherit',
  },
} as const;

export function BieuDoDoanhThu({
  ds,
}: {
  ds: { ngay: string; doanh_thu: number; chi_cho: number }[];
}) {
  return (
    <KhungBieuDo tieuDe="Doanh thu và chi chợ theo ngày" trong={ds.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={ds} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
          <XAxis dataKey="ngay" tickFormatter={ngayNgan} tick={TRUC} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={tienNgan} tick={TRUC} tickLine={false} axisLine={false} width={52} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v, ten) => [tien(Number(v)), ten === 'doanh_thu' ? 'Doanh thu' : 'Chi chợ']}
            labelFormatter={(l) => ngayNgan(String(l))}
          />
          <Line
            type="monotone"
            dataKey="doanh_thu"
            name="doanh_thu"
            stroke={XANH}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="chi_cho"
            name="chi_cho"
            stroke={CAM}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </KhungBieuDo>
  );
}

export function BieuDoTopMon({ ds }: { ds: { ten: string; lai: number }[] }) {
  return (
    <KhungBieuDo
      tieuDe="Top 10 món theo lãi"
      moTa="Lãi = (giá bán − giá vốn mỗi suất) × số suất đã bán"
      trong={ds.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={ds} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" horizontal={false} />
          <XAxis type="number" tickFormatter={tienNgan} tick={TRUC} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="ten" tick={TRUC} tickLine={false} axisLine={false} width={92} />
          <Tooltip {...tooltipStyle} formatter={(v) => [tien(Number(v)), 'Lãi']} />
          <Bar dataKey="lai" fill={XANH} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </KhungBieuDo>
  );
}

export function BieuDoWaste({ ds }: { ds: { ten: string; tien_do_di: number }[] }) {
  return (
    <KhungBieuDo
      tieuDe="Tiền đổ đi theo món"
      moTa="Suất nấu ra mà không bán được — nguồn lỗ lớn nhất của mô hình này"
      trong={ds.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={ds} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" horizontal={false} />
          <XAxis type="number" tickFormatter={tienNgan} tick={TRUC} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="ten" tick={TRUC} tickLine={false} axisLine={false} width={92} />
          <Tooltip {...tooltipStyle} formatter={(v) => [tien(Number(v)), 'Đổ đi']} />
          <Bar dataKey="tien_do_di" fill={DO} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </KhungBieuDo>
  );
}
