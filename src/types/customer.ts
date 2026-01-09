export interface Customer {
    id?: string;
    name: string;
    email: string;
    phone: string;
    totalBookings: number;
    lastBookingDate?: any; // Firestore Timestamp
    createdAt?: any; // Firestore Timestamp
    source: 'online' | 'offline' | 'offline_pos';
    notes?: string;
    lastService?: string; // The most recent service/package they bought
    babyDetails?: string; // Optional: Store baby details if relevant across bookings
}
