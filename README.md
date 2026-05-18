# Blood Bank Management System - DBMS Project

A comprehensive React-based frontend for a Blood Bank Management System designed for DBMS projects.

## Features

### 1. **Dashboard**
   - Real-time statistics on blood inventory
   - Quick overview of donors, requests, and staff
   - Monthly activity reports
   - Blood type availability summary

### 2. **Donor Management**
   - Register new donors
   - View all registered donors
   - Track donor information (name, email, phone, blood type)
   - Monitor donation history
   - Delete/manage donor records

### 3. **Blood Inventory Management**
   - Track blood stock by type (O+, O-, A+, A-, B+, B-, AB+, AB-)
   - Add new blood units to inventory
   - Monitor stock levels (Critical, Low, Adequate)
   - Track expiry dates
   - Manage blood sources

### 4. **Blood Requests**
   - Submit blood requests from hospitals
   - Track request status (Pending, Processing, Completed)
   - Manage urgency levels (Normal, High, Critical)
   - Monitor patient information
   - Process and fulfill blood requests

### 5. **Reports & Analytics**
   - Generate donation reports
   - Blood request analysis
   - Inventory reports
   - Donor statistics
   - Top donors tracking
   - Monthly statistics
   - Print functionality

### 6. **Staff Management**
   - Register staff members
   - Track staff roles (Medical Director, Phlebotomist, Lab Technician, Administrative)
   - Department management
   - Staff status tracking
   - Employee directory

## Technology Stack

- **React 18** - UI Framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS3** - Styling and responsive design
- **Vite** - Build tool and dev server

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Navigate to the project directory:
```bash
cd "d:\New folder\Sankalp PS\Dbms"
```

2. Install dependencies (if not already installed):
```bash
npm install
```

### Running the Application

To start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Building for Production

To build the project for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx          # Top navigation bar
│   └── Sidebar.jsx         # Left sidebar navigation
├── pages/
│   ├── Dashboard.jsx       # Dashboard page
│   ├── DonorManagement.jsx # Donor management page
│   ├── BloodInventory.jsx  # Inventory management page
│   ├── BloodRequests.jsx   # Blood requests page
│   ├── Reports.jsx         # Reports and analytics page
│   └── StaffManagement.jsx # Staff management page
├── services/               # API service files (ready for backend integration)
├── App.jsx                 # Main app component with routing
├── App.css                 # Global styles
├── main.jsx                # Application entry point
└── index.css               # Global styles
```

## Color Scheme

- **Primary Color**: #c41e3a (Red - Blood Bank)
- **Secondary Color**: #003f7f (Blue - Professional)
- **Success Color**: #27ae60 (Green)
- **Warning Color**: #f39c12 (Orange)
- **Danger Color**: #e74c3c (Red)

## API Integration

The application is ready for backend integration. To connect to a backend API:

1. Create API service files in the `src/services/` directory
2. Replace mock data with API calls using axios
3. Update the component state management accordingly

Example service file structure:
```javascript
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

export const donorService = {
  getAll: () => axios.get(`${API_BASE_URL}/donors`),
  create: (data) => axios.post(`${API_BASE_URL}/donors`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/donors/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/donors/${id}`),
}
```

## Features Implemented

✅ Responsive design  
✅ Navigation and routing  
✅ Dashboard with statistics  
✅ Donor management (CRUD)  
✅ Blood inventory tracking  
✅ Blood request management  
✅ Reports and analytics  
✅ Staff management  
✅ Search and filter functionality  
✅ Status tracking  
✅ Urgency levels  
✅ Print functionality  

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Backend API integration
- User authentication and authorization
- Advanced search and filtering
- Email notifications
- SMS alerts for critical requests
- Database integration
- User profiles and settings
- Donor appointment scheduling
- Inventory alerts and notifications
- Export to CSV/PDF

## Database Schema Considerations

When integrating with a backend, consider the following tables:

- **Donors**: id, name, email, phone, bloodType, dob, address, lastDonation, totalDonations
- **BloodInventory**: id, bloodType, units, expiryDate, source, lastUpdated
- **BloodRequests**: id, patientName, hospital, bloodType, units, urgency, reason, requestDate, status
- **Staff**: id, name, email, phone, role, department, joinDate, status
- **Users**: id, email, password, role, createdAt

## Development Tips

1. Use the browser's React DevTools extension for debugging
2. Mock data is provided for development; replace with API calls when backend is ready
3. Maintain consistent naming conventions and code structure
4. Test responsive design at different screen sizes
5. Implement proper error handling and validation

## License

This project is created for educational and commercial purposes as a DBMS project.

## Support

For issues or questions regarding this Blood Bank Management System frontend, please create an issue or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: January 2024
