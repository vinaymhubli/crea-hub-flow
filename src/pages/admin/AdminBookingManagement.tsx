import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminBookings } from "@/hooks/useAdminBookings";
import { Button } from "@/components/ui/button";
import { Search, CalendarCheck, CalendarX2, CalendarClock, ListFilter } from "lucide-react";

type BookingTab = "all" | "upcoming" | "completed" | "cancelled";

const TABS: { id: BookingTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "completed":
      return "default";
    case "pending":
    case "confirmed":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
};

const getDisplayName = (first?: string | null, last?: string | null, fallback = "Unknown") => {
  const name = `${first || ""} ${last || ""}`.trim();
  return name.length ? name : fallback;
};

const matchesSearch = (booking: any, query: string) => {
  if (!query) return true;
  const haystack = [
    booking.service,
    getDisplayName(booking.customer?.first_name, booking.customer?.last_name, ""),
    getDisplayName(booking.designer?.user?.first_name, booking.designer?.user?.last_name, ""),
    booking.total_amount?.toString() || "",
    new Date(booking.scheduled_date).toLocaleDateString(),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
};

const isUpcoming = (booking: any) => {
  const status = booking.status?.toLowerCase();
  
  // Exclude completed and cancelled bookings
  if (["completed", "cancelled"].includes(status)) return false;
  
  // Check if the scheduled date is in the future
  const sessionDate = new Date(booking.scheduled_date);
  const isFutureDate = sessionDate.getTime() >= Date.now();
  
  // Only show as upcoming if date is in the future AND status is appropriate
  return isFutureDate && ["pending", "confirmed", "in_progress"].includes(status);
};

const filterByTab = (booking: any, tab: BookingTab) => {
  switch (tab) {
    case "upcoming":
      return isUpcoming(booking);
    case "completed":
      return booking.status === "completed";
    case "cancelled":
      return booking.status === "cancelled";
    default:
      return true;
  }
};

export default function AdminBookingManagement() {
  const { bookings, loading, refetch } = useAdminBookings();
  const [activeTab, setActiveTab] = useState<BookingTab>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const searchQuery = searchTerm.trim().toLowerCase();

  const filteredBookings = useMemo(() => {
    return bookings.filter(
      (booking) => filterByTab(booking, activeTab) && matchesSearch(booking, searchQuery)
    );
  }, [bookings, activeTab, searchQuery]);

  const counts = useMemo<Record<BookingTab, number>>(() => {
    return {
      all: bookings.length,
      upcoming: bookings.filter((b) => filterByTab(b, "upcoming")).length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };
  }, [bookings]);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground">
            Monitor all platform bookings with quick filters and search.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by service, customer, designer, date, or amount..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ListFilter className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="text-2xl font-semibold">{counts.all}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarClock className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-semibold">{counts.upcoming}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarCheck className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-semibold">{counts.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarX2 className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Cancelled</p>
              <p className="text-2xl font-semibold">{counts.cancelled}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Booking Records</CardTitle>
        <Button variant="outline" onClick={refetch}>
          Refresh
        </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <span>{tab.label}</span>
                  <Badge variant="secondary">{counts[tab.id]}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {TABS.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Designer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                            {loading ? "Loading bookings..." : "No bookings found for this filter."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">{booking.service}</TableCell>
                            <TableCell>
                              {getDisplayName(
                                booking.customer?.first_name,
                                booking.customer?.last_name
                              )}
                            </TableCell>
                            <TableCell>
                              {getDisplayName(
                                booking.designer?.user?.first_name,
                                booking.designer?.user?.last_name
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusBadgeVariant(booking.status)}>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">₹{booking.total_amount || 0}</TableCell>
                            <TableCell className="text-right">
                              {new Date(booking.scheduled_date).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

