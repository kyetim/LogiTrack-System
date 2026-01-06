erDiagram
    User ||--o{ DriverProfile : "has"
    User {
        uuid id PK
        string email
        string password_hash
        enum role "ADMIN, DISPATCHER, DRIVER"
    }

    DriverProfile ||--o{ Vehicle : "drives"
    DriverProfile {
        uuid id PK
        uuid user_id FK
        string license_number
        boolean is_active
        enum status "ON_DUTY, OFF_DUTY"
    }

    Vehicle {
        uuid id PK
        string plate_number
        float capacity
        string type
    }

    Shipment ||--o{ User : "assigned_to"
    Shipment {
        uuid id PK
        uuid driver_id FK
        geometry pickup_loc
        geometry delivery_loc
        enum status "PENDING, IN_TRANSIT, DELIVERED, CANCELLED"
        json proof_of_delivery
    }

    LocationLog {
        uuid id PK
        uuid driver_id FK
        geometry coordinate
        timestamp created_at
        float speed
    }

    DriverProfile ||--o{ LocationLog : "generates"
    DriverProfile ||--o{ Shipment : "delivers"