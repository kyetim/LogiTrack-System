import { Driver, TodayStats, Delivery, AvailableJob } from '../types';

// Sürücü profili
export const mockDriver: Driver = {
    id: 'drv_001',
    fullName: 'Ahmet Yılmaz',
    phone: '+90 532 111 22 33',
    email: 'ahmet@logitrack.com',
    avatarInitials: 'AY',
    rating: 4.8,
    totalDeliveries: 247,
    joinDate: '2024-01-15',
    vehicleType: 'Motosiklet',
    vehiclePlate: '34 ABC 123',
    isOnline: true,
};

// Bugünkü özet istatistikler
export const mockTodayStats: TodayStats = {
    earnings: 485,
    deliveries: 6,
    hoursOnline: 4.5,
    rating: 4.9,
    earningsTrend: '+12%',
    deliveriesTrend: '+2',
};

// Aktif teslimat (dashboard'da gösterilecek)
export const mockActiveDelivery: Delivery = {
    id: 'del_active_001',
    customerName: 'Zeynep Kaya',
    customerPhone: '+90 533 222 33 44',
    pickupAddress: 'Kadıköy Merkez, Moda Cad. No:12',
    deliveryAddress: 'Üsküdar, Bağlarbaşı Mah. Çavuşdere Cad. No:45',
    distance: '4.2 km',
    estimatedTime: '18 dk',
    price: '₺95',
    status: 'active',
    packageType: 'standard',
    progress: 0.45,   // %45 tamamlandı
    pickupTime: '14:20',
    notes: 'Bina girişinde bekleyin, interkom 3. kat.',
};

// Teslimat geçmişi listesi (7 kayıt)
export const mockDeliveries: Delivery[] = [
    {
        id: 'del_001',
        customerName: 'Mehmet Demir',
        pickupAddress: 'Beşiktaş, Sinanpaşa Mah.',
        deliveryAddress: 'Şişli, Mecidiyeköy',
        distance: '3.8 km',
        estimatedTime: '22 dk',
        price: '₺75',
        status: 'completed',
        packageType: 'document',
        date: 'Bugün, 13:15',
    },
    {
        id: 'del_002',
        customerName: 'Ayşe Çelik',
        pickupAddress: 'Beyoğlu, İstiklal Cad.',
        deliveryAddress: 'Fatih, Sultanahmet',
        distance: '5.1 km',
        estimatedTime: '28 dk',
        price: '₺110',
        status: 'completed',
        packageType: 'fragile',
        date: 'Bugün, 11:40',
    },
    {
        id: 'del_003',
        customerName: 'Can Öztürk',
        pickupAddress: 'Maltepe, Bağlarbaşı',
        deliveryAddress: 'Kartal, Yukarı Mah.',
        distance: '6.3 km',
        estimatedTime: '35 dk',
        price: '₺130',
        status: 'cancelled',
        packageType: 'heavy',
        date: 'Dün, 16:50',
    },
    {
        id: 'del_004',
        customerName: 'Fatma Arslan',
        pickupAddress: 'Ataşehir, Atatürk Mah.',
        deliveryAddress: 'Kadıköy, Moda',
        distance: '4.7 km',
        estimatedTime: '25 dk',
        price: '₺90',
        status: 'completed',
        packageType: 'standard',
        date: 'Dün, 14:20',
    },
    {
        id: 'del_005',
        customerName: 'Ali Yıldız',
        pickupAddress: 'Üsküdar, Altunizade',
        deliveryAddress: 'Beykoz, Kavacık',
        distance: '8.9 km',
        estimatedTime: '40 dk',
        price: '₺165',
        status: 'completed',
        packageType: 'heavy',
        date: 'Dün, 10:05',
    },
    {
        id: 'del_006',
        customerName: 'Selin Kara',
        pickupAddress: 'Sarıyer, Maslak',
        deliveryAddress: 'Beşiktaş, Levent',
        distance: '3.2 km',
        estimatedTime: '20 dk',
        price: '₺70',
        status: 'completed',
        packageType: 'document',
        date: '2 gün önce, 15:30',
    },
    {
        id: 'del_007',
        customerName: 'Burak Şahin',
        pickupAddress: 'Bağcılar, Güneşli',
        deliveryAddress: 'Bakırköy, Ataköy',
        distance: '5.8 km',
        estimatedTime: '30 dk',
        price: '₺115',
        status: 'completed',
        packageType: 'fragile',
        date: '2 gün önce, 12:10',
    },
];

// Yakındaki müsait işler (5 kayıt)
export const mockAvailableJobs: AvailableJob[] = [
    {
        id: 'job_001',
        customerName: 'Hızlı Kargo A.Ş.',
        pickupAddress: 'Kadıköy, Söğütlüçeşme',
        deliveryAddress: 'Beşiktaş, Nişantaşı',
        distance: '6.4 km',
        estimatedTime: '32 dk',
        price: '₺120',
        packageType: 'standard',
        postedTime: '3 dk önce',
        pickupDistance: '0.8 km',   // sürücüye olan mesafe
        expiresIn: 180,              // saniye cinsinden
    },
    {
        id: 'job_002',
        customerName: 'Bireysel Gönderici',
        pickupAddress: 'Üsküdar, Bağlarbaşı',
        deliveryAddress: 'Ataşehir, Küçükbakkalköy',
        distance: '4.1 km',
        estimatedTime: '22 dk',
        price: '₺85',
        packageType: 'fragile',
        postedTime: '7 dk önce',
        pickupDistance: '1.2 km',
        expiresIn: 95,
    },
    {
        id: 'job_003',
        customerName: 'Leziz Restoran',
        pickupAddress: 'Moda, Bahariye Cad.',
        deliveryAddress: 'Fenerbahçe, Plaj Yolu',
        distance: '2.9 km',
        estimatedTime: '18 dk',
        price: '₺65',
        packageType: 'document',
        postedTime: '12 dk önce',
        pickupDistance: '0.4 km',
        expiresIn: 45,
    },
    {
        id: 'job_004',
        customerName: 'Teknoloji Mağazası',
        pickupAddress: 'Bağcılar, Güneşli AVM',
        deliveryAddress: 'Eyüpsultan, Rami',
        distance: '7.6 km',
        estimatedTime: '38 dk',
        price: '₺145',
        packageType: 'heavy',
        postedTime: '5 dk önce',
        pickupDistance: '2.1 km',
        expiresIn: 250,
    },
    {
        id: 'job_005',
        customerName: 'Kurumsal Şirket',
        pickupAddress: 'Şişli, Büyükdere Cad.',
        deliveryAddress: 'Sarıyer, Maslak',
        distance: '3.5 km',
        estimatedTime: '20 dk',
        price: '₺80',
        packageType: 'document',
        postedTime: '15 dk önce',
        pickupDistance: '1.8 km',
        expiresIn: 320,
    },
];

// Sorun bildirme kategorileri
export const issueCategories = [
    { id: 'iss_01', label: 'Adres bulunamadı', icon: 'map-off' },
    { id: 'iss_02', label: 'Alıcı ulaşılamıyor', icon: 'phone-off' },
    { id: 'iss_03', label: 'Paket hasarlı', icon: 'package-x' },
    { id: 'iss_04', label: 'Yanlış paket', icon: 'alert-triangle' },
    { id: 'iss_05', label: 'Güvenli bölge değil', icon: 'shield-off' },
    { id: 'iss_06', label: 'Alıcı teslim almıyor', icon: 'user-x' },
    { id: 'iss_07', label: 'Araç arızası', icon: 'truck' },
    { id: 'iss_08', label: 'Diğer', icon: 'more-horizontal' },
];

// Sürücü kazanç geçmişi (haftalık)
export const mockEarningsHistory = {
    thisWeek: {
        total: 2840,
        days: [
            { day: 'Pzt', earnings: 485, deliveries: 6 },
            { day: 'Sal', earnings: 320, deliveries: 4 },
            { day: 'Çar', earnings: 610, deliveries: 8 },
            { day: 'Per', earnings: 290, deliveries: 3 },
            { day: 'Cum', earnings: 720, deliveries: 9 },
            { day: 'Cmt', earnings: 415, deliveries: 5 },
            { day: 'Paz', earnings: 0, deliveries: 0 },
        ],
    },
    lastWeek: {
        total: 2530,
        days: [
            { day: 'Pzt', earnings: 380, deliveries: 5 },
            { day: 'Sal', earnings: 490, deliveries: 6 },
            { day: 'Çar', earnings: 275, deliveries: 3 },
            { day: 'Per', earnings: 520, deliveries: 7 },
            { day: 'Cum', earnings: 415, deliveries: 5 },
            { day: 'Cmt', earnings: 450, deliveries: 6 },
            { day: 'Paz', earnings: 0, deliveries: 0 },
        ],
    },
    bonuses: [
        { label: 'Haftalık Hedef Bonusu', amount: 150 },
        { label: 'Erken Teslimat Bonusu', amount: 75 },
        { label: 'Müşteri Memnuniyeti', amount: 50 },
    ],
};

// Destek sohbet geçmişi
export const mockSupportChat = [
    {
        id: 'msg_001',
        sender: 'support',
        text: 'Merhaba Ahmet Bey! Size nasıl yardımcı olabilirim?',
        time: '14:22',
    },
    {
        id: 'msg_002',
        sender: 'driver',
        text: 'Merhaba, del_002 numaralı teslimat hakkında sorum vardı.',
        time: '14:23',
    },
    {
        id: 'msg_003',
        sender: 'support',
        text: 'Elbette, teslimatınızla ilgili tüm detaylara bakıyorum. Lütfen bekleyin.',
        time: '14:24',
    },
];
