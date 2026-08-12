import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BedDouble, CalendarDays, CheckCircle2, Edit3, Images, MapPin, Save, Sparkles } from "lucide-react";

type HotelRecord = {
  id: number;
  name: string;
  location: string;
  address?: string | null;
  description?: string | null;
  amenities?: unknown;
  images?: unknown;
  lat?: number | string | null;
  lng?: number | string | null;
  isBillflowConnected?: number | boolean | null;
  approvalStatus?: string;
};

type RoomRecord = {
  id: number;
  hotelId: number;
  name: string;
  roomType: string;
  description?: string | null;
  capacity: number;
  priceGhs: number | string;
  priceUsd: number | string;
  totalRooms: number;
  amenities?: unknown;
  images?: unknown;
};

const asList = (value: unknown) => Array.isArray(value) ? value.map(String) : [];
const formatMoney = (value: number, currency: "GHS" | "USD") => new Intl.NumberFormat(currency === "GHS" ? "en-GH" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
const plusDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export function PartnerInventoryPanel({ hotel, hotelId, rooms }: { hotel: HotelRecord; hotelId: number; rooms: RoomRecord[] }) {
  const utils = trpc.useUtils();
  const [propertyForm, setPropertyForm] = useState(() => ({
    name: hotel.name ?? "",
    location: hotel.location ?? "",
    address: hotel.address ?? "",
    description: hotel.description ?? "",
    amenities: asList(hotel.amenities).join("\n"),
    images: asList(hotel.images).join("\n"),
    lat: hotel.lat ? String(hotel.lat) : "",
    lng: hotel.lng ? String(hotel.lng) : "",
  }));
  const [roomForm, setRoomForm] = useState({ name: "", roomType: "standard", description: "", capacity: "2", priceGhs: "", priceUsd: "", totalRooms: "1", amenities: "", images: "" });
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [dates, setDates] = useState({ checkInDate: plusDays(14), checkOutDate: plusDays(17) });
  const availabilityInput = useMemo(() => ({ hotelId, ...dates }), [hotelId, dates]);
  const { data: availability = [], isLoading: availabilityLoading } = trpc.hotel.availability.useQuery(availabilityInput, { enabled: hotelId > 0 });
  const updateHotel = trpc.hotel.update.useMutation({
    onSuccess: () => { toast.success("Property details saved"); void utils.hotel.mine.invalidate(); },
    onError: (error) => toast.error(error.message || "Could not save property details"),
  });
  const createRoom = trpc.hotel.createRoom.useMutation({
    onSuccess: () => { toast.success("Room added to inventory"); setRoomForm({ name: "", roomType: "standard", description: "", capacity: "2", priceGhs: "", priceUsd: "", totalRooms: "1", amenities: "", images: "" }); void utils.hotel.rooms.invalidate({ hotelId }); void utils.hotel.availability.invalidate(availabilityInput); },
    onError: (error) => toast.error(error.message || "Could not add room"),
  });
  const updateRoom = trpc.hotel.updateRoom.useMutation({
    onSuccess: () => { toast.success("Room details updated"); setEditingRoomId(null); void utils.hotel.rooms.invalidate({ hotelId }); void utils.hotel.availability.invalidate(availabilityInput); },
    onError: (error) => toast.error(error.message || "Could not update room"),
  });

  useEffect(() => {
    setPropertyForm({
      name: hotel.name ?? "",
      location: hotel.location ?? "",
      address: hotel.address ?? "",
      description: hotel.description ?? "",
      amenities: asList(hotel.amenities).join("\n"),
      images: asList(hotel.images).join("\n"),
      lat: hotel.lat ? String(hotel.lat) : "",
      lng: hotel.lng ? String(hotel.lng) : "",
    });
  }, [hotel]);

  const saveProperty = () => {
    if (!propertyForm.name.trim() || !propertyForm.location.trim()) return toast.error("Property name and location are required");
    updateHotel.mutate({
      id: hotelId,
      name: propertyForm.name.trim(),
      location: propertyForm.location.trim(),
      address: propertyForm.address.trim() || null,
      description: propertyForm.description.trim() || null,
      amenities: propertyForm.amenities.split("\n").map((item) => item.trim()).filter(Boolean),
      images: propertyForm.images.split("\n").map((item) => item.trim()).filter(Boolean),
      lat: propertyForm.lat.trim() ? Number(propertyForm.lat) : null,
      lng: propertyForm.lng.trim() ? Number(propertyForm.lng) : null,
    });
  };

  const beginRoomEdit = (room: RoomRecord) => {
    setEditingRoomId(room.id);
    setRoomForm({
      name: room.name,
      roomType: room.roomType,
      description: room.description ?? "",
      capacity: String(room.capacity),
      priceGhs: String(room.priceGhs),
      priceUsd: String(room.priceUsd),
      totalRooms: String(room.totalRooms),
      amenities: asList(room.amenities).join("\n"),
      images: asList(room.images).join("\n"),
    });
  };

  const saveRoom = () => {
    if (!roomForm.name.trim() || !roomForm.priceGhs || !roomForm.priceUsd) return toast.error("Add the room name and both nightly rates");
    const payload = {
      name: roomForm.name.trim(),
      roomType: roomForm.roomType.trim() || "standard",
      description: roomForm.description.trim() || undefined,
      capacity: Number(roomForm.capacity),
      priceGhs: Number(roomForm.priceGhs),
      priceUsd: Number(roomForm.priceUsd),
      totalRooms: Number(roomForm.totalRooms),
      amenities: roomForm.amenities.split("\n").map((item) => item.trim()).filter(Boolean),
      images: roomForm.images.split("\n").map((item) => item.trim()).filter(Boolean),
    };
    if (editingRoomId) updateRoom.mutate({ id: editingRoomId, hotelId, ...payload });
    else createRoom.mutate({ hotelId, ...payload });
  };

  return <div className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
    <Card className="rounded-[22px] border-[#dfe4dc] bg-white shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-4 p-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b18143]">Property details</p><CardTitle className="mt-2 font-serif text-[28px] text-[#183a31]">Your listing, your story.</CardTitle></div><Badge className={hotel.isBillflowConnected ? "border-0 bg-[#e8efe7] text-[#2b6755]" : "border-0 bg-[#f3f5f0] text-[#607269]"}>{hotel.isBillflowConnected ? "BillFlow connected" : "Manual listing"}</Badge></CardHeader>
      <CardContent className="grid gap-4 p-6 pt-0"><div className="grid gap-4 sm:grid-cols-2"><div><Label className="text-xs font-bold text-[#607269]">Property name</Label><Input value={propertyForm.name} onChange={(event) => setPropertyForm({ ...propertyForm, name: event.target.value })} className="mt-2 h-10 rounded-xl border-[#dfe4dc]" /></div><div><Label className="text-xs font-bold text-[#607269]">Location</Label><Input value={propertyForm.location} onChange={(event) => setPropertyForm({ ...propertyForm, location: event.target.value })} className="mt-2 h-10 rounded-xl border-[#dfe4dc]" /></div></div><div><Label className="text-xs font-bold text-[#607269]">Street address</Label><Input value={propertyForm.address} onChange={(event) => setPropertyForm({ ...propertyForm, address: event.target.value })} className="mt-2 h-10 rounded-xl border-[#dfe4dc]" /></div><div><Label className="text-xs font-bold text-[#607269]">Description</Label><Textarea value={propertyForm.description} onChange={(event) => setPropertyForm({ ...propertyForm, description: event.target.value })} className="mt-2 min-h-[100px] rounded-xl border-[#dfe4dc]" /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label className="text-xs font-bold text-[#607269]">Amenities <span className="font-normal text-[#8a9890]">one per line</span></Label><Textarea value={propertyForm.amenities} onChange={(event) => setPropertyForm({ ...propertyForm, amenities: event.target.value })} placeholder="Airport transfer\nBreakfast\nPool" className="mt-2 min-h-[90px] rounded-xl border-[#dfe4dc]" /></div><div><Label className="text-xs font-bold text-[#607269]">Photo URLs <span className="font-normal text-[#8a9890]">one per line</span></Label><Textarea value={propertyForm.images} onChange={(event) => setPropertyForm({ ...propertyForm, images: event.target.value })} placeholder="https://…" className="mt-2 min-h-[90px] rounded-xl border-[#dfe4dc]" /></div></div><div className="grid gap-4 sm:grid-cols-2"><div><Label className="text-xs font-bold text-[#607269]">Latitude <span className="font-normal text-[#8a9890]">optional</span></Label><Input value={propertyForm.lat} onChange={(event) => setPropertyForm({ ...propertyForm, lat: event.target.value })} placeholder="5.6037" className="mt-2 h-10 rounded-xl border-[#dfe4dc]" /></div><div><Label className="text-xs font-bold text-[#607269]">Longitude <span className="font-normal text-[#8a9890]">optional</span></Label><Input value={propertyForm.lng} onChange={(event) => setPropertyForm({ ...propertyForm, lng: event.target.value })} placeholder="-0.1870" className="mt-2 h-10 rounded-xl border-[#dfe4dc]" /></div></div><Button onClick={saveProperty} disabled={updateHotel.isPending} className="h-11 rounded-xl bg-[#183a31] text-sm font-bold text-white"><Save size={15} />{updateHotel.isPending ? "Saving…" : "Save property details"}</Button></CardContent>
    </Card>
    <div className="space-y-6">
      <Card className="rounded-[22px] border-[#dfe4dc] bg-white shadow-none"><CardHeader className="p-6"><div className="flex items-center gap-2 text-[#b18143]"><CalendarDays size={16} /><span className="text-[10px] font-bold uppercase tracking-[0.16em]">Manual availability</span></div><CardTitle className="mt-2 font-serif text-[28px] text-[#183a31]">What guests can book</CardTitle></CardHeader><CardContent className="p-6 pt-0"><div className="grid gap-3 sm:grid-cols-2"><div><Label className="text-xs font-bold text-[#607269]">Check-in</Label><Input type="date" value={dates.checkInDate} onChange={(event) => setDates({ ...dates, checkInDate: event.target.value })} className="mt-2 h-10 rounded-xl border-[#dfe4dc]" /></div><div><Label className="text-xs font-bold text-[#607269]">Check-out</Label><Input type="date" value={dates.checkOutDate} onChange={(event) => setDates({ ...dates, checkOutDate: event.target.value })} className="mt-2 h-10 rounded-xl border-[#dfe4dc]" /></div></div><div className="mt-5 space-y-3">{availabilityLoading ? <div className="h-20 animate-pulse rounded-xl bg-[#f3f5f0]" /> : availability.length === 0 ? <p className="rounded-xl bg-[#f3f5f0] p-4 text-sm text-[#718078]">Add a room type to see available inventory here.</p> : availability.map((room: any) => <div key={room.id} className="flex items-center justify-between rounded-xl border border-[#e5ebe4] p-3"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#e8efe7] text-[#2b6755]"><BedDouble size={16} /></div><div><p className="text-sm font-semibold text-[#183a31]">{room.name}</p><p className="text-[11px] text-[#8a9890]">{room.bookedRooms} booked · {room.totalRooms} total</p></div></div><Badge className={room.availableRooms > 0 ? "border-0 bg-[#e8efe7] text-[#2b6755]" : "border-0 bg-[#fff1e7] text-[#a35c29]"}>{room.availableRooms} available</Badge></div>)}</div></CardContent></Card>
      <Card className="rounded-[22px] border-[#dfe4dc] bg-[#183a31] text-white shadow-none"><CardContent className="p-6"><div className="flex items-center gap-2 text-[#e7c77b]"><Sparkles size={16} /><span className="text-[10px] font-bold uppercase tracking-[0.16em]">Publishing checklist</span></div><div className="mt-4 space-y-3 text-xs text-[#d8e4d9]"><div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#e7c77b]" /> Property details complete</div><div className="flex items-center gap-2"><Images size={15} className="text-[#e7c77b]" /> Add room photos and amenities</div><div className="flex items-center gap-2"><MapPin size={15} className="text-[#e7c77b]" /> Add map coordinates for directions</div></div></CardContent></Card>
    </div>
    <Card className="rounded-[22px] border-[#dfe4dc] bg-white shadow-none lg:col-span-2"><CardHeader className="flex-row items-center justify-between gap-4 p-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b18143]">Inventory management</p><CardTitle className="mt-2 font-serif text-[28px] text-[#183a31]">Rooms, rates, and details</CardTitle></div><Badge className="border-0 bg-[#f3f5f0] text-[#607269]">{rooms.length} room types</Badge></CardHeader><CardContent className="grid gap-6 p-6 pt-0 lg:grid-cols-[1fr_360px]"><div className="space-y-3">{rooms.length === 0 ? <p className="rounded-xl bg-[#f3f5f0] p-5 text-sm text-[#718078]">No room types yet. Add the first room on the right to make your property bookable after approval.</p> : rooms.map((room) => <div key={room.id} className="flex flex-col gap-4 rounded-xl border border-[#e5ebe4] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-serif text-[22px] text-[#183a31]">{room.name}</p><p className="mt-1 text-xs text-[#718078]">{room.roomType} · sleeps {room.capacity} · {room.totalRooms} total rooms</p><p className="mt-2 text-xs font-semibold text-[#2b6755]">{formatMoney(Number(room.priceGhs), "GHS")} · {formatMoney(Number(room.priceUsd), "USD")} per night</p></div><Button onClick={() => beginRoomEdit(room)} variant="outline" className="rounded-lg border-[#dfe4dc] text-xs font-bold text-[#183a31]"><Edit3 size={14} /> Edit details</Button></div>)}</div><div className="space-y-4 rounded-xl bg-[#f3f5f0] p-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b18143]">{editingRoomId ? "Edit room type" : "Add room type"}</p><p className="mt-2 text-xs leading-5 text-[#718078]">Keep rates and inventory current so guests only see rooms you can honor.</p></div><Input value={roomForm.name} onChange={(event) => setRoomForm({ ...roomForm, name: event.target.value })} placeholder="Room name" className="h-10 rounded-xl border-[#dfe4dc] bg-white" /><div className="grid grid-cols-2 gap-3"><Input value={roomForm.roomType} onChange={(event) => setRoomForm({ ...roomForm, roomType: event.target.value })} placeholder="Room type" className="h-10 rounded-xl border-[#dfe4dc] bg-white" /><Input type="number" min="1" value={roomForm.capacity} onChange={(event) => setRoomForm({ ...roomForm, capacity: event.target.value })} placeholder="Sleeps" className="h-10 rounded-xl border-[#dfe4dc] bg-white" /></div><Textarea value={roomForm.description} onChange={(event) => setRoomForm({ ...roomForm, description: event.target.value })} placeholder="Room description" className="min-h-[75px] rounded-xl border-[#dfe4dc] bg-white" /><div className="grid grid-cols-2 gap-3"><Input type="number" min="0" value={roomForm.priceGhs} onChange={(event) => setRoomForm({ ...roomForm, priceGhs: event.target.value })} placeholder="GHS / night" className="h-10 rounded-xl border-[#dfe4dc] bg-white" /><Input type="number" min="0" value={roomForm.priceUsd} onChange={(event) => setRoomForm({ ...roomForm, priceUsd: event.target.value })} placeholder="USD / night" className="h-10 rounded-xl border-[#dfe4dc] bg-white" /></div><Input type="number" min="0" value={roomForm.totalRooms} onChange={(event) => setRoomForm({ ...roomForm, totalRooms: event.target.value })} placeholder="Total rooms" className="h-10 rounded-xl border-[#dfe4dc] bg-white" /><div className="grid grid-cols-2 gap-3"><Textarea value={roomForm.amenities} onChange={(event) => setRoomForm({ ...roomForm, amenities: event.target.value })} placeholder="Amenities, one per line" className="min-h-[75px] rounded-xl border-[#dfe4dc] bg-white" /><Textarea value={roomForm.images} onChange={(event) => setRoomForm({ ...roomForm, images: event.target.value })} placeholder="Photo URLs, one per line" className="min-h-[75px] rounded-xl border-[#dfe4dc] bg-white" /></div><div className="flex gap-2"><Button onClick={saveRoom} disabled={createRoom.isPending || updateRoom.isPending} className="h-10 flex-1 rounded-xl bg-[#183a31] text-xs font-bold text-white">{editingRoomId ? "Save room" : "Add room"}</Button>{editingRoomId && <Button onClick={() => { setEditingRoomId(null); setRoomForm({ name: "", roomType: "standard", description: "", capacity: "2", priceGhs: "", priceUsd: "", totalRooms: "1", amenities: "", images: "" }); }} variant="outline" className="h-10 rounded-xl border-[#dfe4dc] text-xs font-bold text-[#183a31]">Cancel</Button>}</div></div></CardContent></Card>
  </div>;
}
