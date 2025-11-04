
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { MapPin, Navigation, Repeat, X, Link as LinkIcon, Loader2, Locate, Copy, Check, ChevronDown, ChevronUp, Shield, AlertTriangle, Users, Star, MessageCircle, Play, Plus, GripVertical, UserPlus, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ChatModal from "../components/ChatModal";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Component to update map view
function MapController({ center, zoom, bounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, bounds, map]);
  
  return null;
}

// Amsterdam locations for demo/autocomplete
const AMSTERDAM_LOCATIONS = [
  { name: "Dam Square, Amsterdam", lat: 52.3731, lng: 4.8932 },
  { name: "Amsterdam Centraal Station", lat: 52.3791, lng: 4.9003 },
  { name: "Rijksmuseum Amsterdam", lat: 52.3600, lng: 4.8852 },
  { name: "Anne Frank House", lat: 52.3752, lng: 4.8840 },
  { name: "Vondelpark Amsterdam", lat: 52.3579, lng: 4.8686 },
  { name: "Rotterdam Centraal", lat: 51.9249, lng: 4.4690 },
  { name: "The Hague Central Station", lat: 52.0808, lng: 4.3248 },
  { name: "Utrecht Centraal", lat: 52.0908, lng: 5.1097 },
  { name: "Schiphol Airport", lat: 52.3105, lng: 4.7683 },
  { name: "Leidseplein Amsterdam", lat: 52.3644, lng: 4.8829 },
];

export default function RoutePlanner() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [waypoints, setWaypoints] = useState([]);
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [waypointCoords, setWaypointCoords] = useState([]);
  const [travelMode, setTravelMode] = useState("DRIVING");
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSafetyPanel, setShowSafetyPanel] = useState(false);
  const [showBuddyRequest, setShowBuddyRequest] = useState(false);
  const [availableBuddies, setAvailableBuddies] = useState([]);
  const [selectedBuddy, setSelectedBuddy] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const queryClient = useQueryClient();

  // Fetch safety reports from community
  const { data: safetyReports = [] } = useQuery({
    queryKey: ["safetyReports"],
    queryFn: () => base44.entities.SafetyReport.list("-created_date", 50),
  });

  const requestBuddyMutation = useMutation({
    mutationFn: (requestData) => base44.entities.BuddyRequest.create(requestData),
    onSuccess: () => {
      toast.success("Buddy request sent!", {
        description: "Nearby buddies will be notified"
      });
      setShowBuddyRequest(false);
      queryClient.invalidateQueries({ queryKey: ["buddyRequests"] });
    },
  });

  useEffect(() => {
    loadUser();
    autoDetectLocation();
  }, []);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const autoDetectLocation = () => {
    setLocationLoading(true);
    setStatusMessage("Detecting your location...");
    
    if (!navigator.geolocation) {
      const amsterdam = AMSTERDAM_LOCATIONS[0];
      setOrigin(amsterdam.name);
      setOriginCoords([amsterdam.lat, amsterdam.lng]);
      setLocationLoading(false);
      setStatusMessage("");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = AMSTERDAM_LOCATIONS[0];
        setOrigin("Current Location");
        setOriginCoords([nearest.lat, nearest.lng]);
        setLocationLoading(false);
        setStatusMessage("");
        toast.success("Location detected");
      },
      (error) => {
        const amsterdam = AMSTERDAM_LOCATIONS[0];
        setOrigin("Current Location");
        setOriginCoords([amsterdam.lat, amsterdam.lng]);
        setLocationLoading(false);
        setStatusMessage("");
      }
    );
  };

  const findAvailableBuddies = async () => {
    if (!currentUser?.buddy_availability?.is_available) {
      toast.info("Enable your availability in Profile to find buddies");
      return;
    }

    // Mock available buddies - in real app would query users with is_available=true
    const mockBuddies = [
      {
        id: "user_1",
        name: "Emma Thompson",
        rating: 4.9,
        trips: 24,
        verified: true,
        route: "Similar route",
        distance: "0.2 km away",
      },
      {
        id: "user_2",
        name: "Sofia Martinez",
        rating: 5.0,
        trips: 18,
        verified: true,
        route: "Going the same way",
        distance: "0.5 km away",
      },
    ];
    
    setAvailableBuddies(mockBuddies);
    setShowBuddyRequest(true);
  };

  const sendBuddyRequest = async (buddy) => {
    if (!originCoords || !destinationCoords) {
      toast.error("Please plan a route first");
      return;
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // 30 minutes from now

    await requestBuddyMutation.mutateAsync({
      from_location: {
        lat: originCoords[0],
        lng: originCoords[1],
        address: origin,
      },
      to_location: {
        lat: destinationCoords[0],
        lng: destinationCoords[1],
        address: destination,
      },
      travel_mode: travelMode.toLowerCase(),
      departure_time: now.toISOString(),
      status: "pending",
      matched_user_id: buddy.id,
      notes: `Route: ${origin} → ${destination}`,
    });
  };

  const handleOriginChange = (value) => {
    setOrigin(value);
    if (value.length > 2) {
      const filtered = AMSTERDAM_LOCATIONS.filter(loc =>
        loc.name.toLowerCase().includes(value.toLowerCase())
      );
      setOriginSuggestions(filtered);
      setShowOriginSuggestions(true);
    } else {
      setShowOriginSuggestions(false);
    }
  };

  const handleDestinationChange = (value) => {
    setDestination(value);
    if (value.length > 2) {
      const filtered = AMSTERDAM_LOCATIONS.filter(loc =>
        loc.name.toLowerCase().includes(value.toLowerCase())
      );
      setDestinationSuggestions(filtered);
      setShowDestinationSuggestions(true);
    } else {
      setShowDestinationSuggestions(false);
    }
  };

  const handleCalculateRoute = () => {
    let currentOriginLoc = null;
    let currentDestLoc = null;

    if (originCoords) {
      currentOriginLoc = { lat: originCoords[0], lng: originCoords[1], name: origin };
    } else if (origin.trim()) {
      currentOriginLoc = AMSTERDAM_LOCATIONS.find(loc => 
        loc.name.toLowerCase() === origin.toLowerCase()
      ) || AMSTERDAM_LOCATIONS.find(loc => 
        loc.name.toLowerCase().includes(origin.toLowerCase())
      );
      if (currentOriginLoc) {
        setOriginCoords([currentOriginLoc.lat, currentOriginLoc.lng]);
      }
    }

    if (destinationCoords) {
      currentDestLoc = { lat: destinationCoords[0], lng: destinationCoords[1], name: destination };
    } else if (destination.trim()) {
      currentDestLoc = AMSTERDAM_LOCATIONS.find(loc => 
        loc.name.toLowerCase() === destination.toLowerCase()
      ) || AMSTERDAM_LOCATIONS.find(loc => 
        loc.name.toLowerCase().includes(destination.toLowerCase())
      );
      if (currentDestLoc) {
        setDestinationCoords([currentDestLoc.lat, currentDestLoc.lng]);
      }
    }

    if (currentOriginLoc && currentDestLoc) {
      calculateRoute(currentOriginLoc, currentDestLoc);
    } else {
      toast.error("Please enter valid origin and destination or select from suggestions.");
    }
  };

  const handleOriginKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showOriginSuggestions && originSuggestions.length > 0) {
        selectOrigin(originSuggestions[0]);
      } else if (origin.trim()) {
        const match = AMSTERDAM_LOCATIONS.find(loc => 
          loc.name.toLowerCase().includes(origin.toLowerCase())
        );
        if (match) {
          selectOrigin(match);
        }
      }
      // If destination is already set, attempt to calculate route after setting origin
      if (destination && originCoords) { 
        handleCalculateRoute();
      }
    }
  };

  const handleDestinationKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showDestinationSuggestions && destinationSuggestions.length > 0) {
        selectDestination(destinationSuggestions[0]);
        if (originCoords) {
          handleCalculateRoute();
        }
      } else if (destination.trim()) {
        const match = AMSTERDAM_LOCATIONS.find(loc => 
          loc.name.toLowerCase().includes(destination.toLowerCase())
        );
        if (match) {
          selectDestination(match);
          if (originCoords) {
            handleCalculateRoute();
          }
        } else if (originCoords) { // If no match found but origin is set, try to calculate with current text
          handleCalculateRoute();
        }
      }
    }
  };


  const selectOrigin = (location) => {
    setOrigin(location.name);
    setOriginCoords([location.lat, location.lng]);
    setShowOriginSuggestions(false);
    
    if (destinationCoords && Array.isArray(destinationCoords) && destinationCoords.length === 2) {
      const destLoc = AMSTERDAM_LOCATIONS.find(l => 
        l.lat === destinationCoords[0] && l.lng === destinationCoords[1]
      );
      if (destLoc) {
        calculateRoute(location, destLoc);
      }
    }
  };

  const selectDestination = (location) => {
    setDestination(location.name);
    setDestinationCoords([location.lat, location.lng]);
    setShowDestinationSuggestions(false);
    
    if (originCoords && Array.isArray(originCoords) && originCoords.length === 2) {
      const originLoc = AMSTERDAM_LOCATIONS.find(l => 
        l.lat === originCoords[0] && l.lng === originCoords[1]
      );
      if (originLoc) {
        calculateRoute(originLoc, location);
      }
    }
  };

  const useMyLocation = () => {
    autoDetectLocation();
  };

  const swapLocations = () => {
    const tempName = origin;
    const tempCoords = originCoords;
    
    setOrigin(destination);
    setOriginCoords(destinationCoords);
    setDestination(tempName);
    setDestinationCoords(tempCoords);
    
    if (destinationCoords && tempCoords && 
        Array.isArray(destinationCoords) && destinationCoords.length === 2 &&
        Array.isArray(tempCoords) && tempCoords.length === 2) {
      const originLoc = AMSTERDAM_LOCATIONS.find(l => 
        l.lat === destinationCoords[0] && l.lng === destinationCoords[1]
      );
      const destLoc = AMSTERDAM_LOCATIONS.find(l => 
        l.lat === tempCoords[0] && l.lng === tempCoords[1]
      );
      if (originLoc && destLoc) {
        calculateRoute(originLoc, destLoc);
      }
    }
  };

  const clearRoute = () => {
    setDestination("");
    setDestinationCoords(null);
    setWaypoints([]);
    setWaypointCoords([]);
    setRoutes([]);
    setSelectedRouteIndex(0);
    setStatusMessage("Route cleared");
    setTimeout(() => setStatusMessage(""), 2000);
  };

  const addWaypoint = () => {
    if (waypoints.length < 3) {
      setWaypoints([...waypoints, ""]);
      setWaypointCoords([...waypointCoords, null]);
    } else {
      toast.info("Maximum 3 waypoints allowed");
    }
  };

  const removeWaypoint = (index) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
    setWaypointCoords(waypointCoords.filter((_, i) => i !== index));
  };

  const calculateRoute = async (originLoc, destLoc) => {
    if (!originLoc || !destLoc) {
      toast.error("Please select both origin and destination");
      return;
    }

    setLoading(true);
    setStatusMessage("Calculating routes...");

    try {
      const now = new Date();
      const hour = now.getHours();
      
      // Time-based speed adjustments
      const getSpeedMultiplier = (mode, hour) => {
        if (mode === "DRIVING") {
          // Rush hours: 7-9 AM and 5-7 PM
          if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
            return 0.6; // 40% slower
          }
          // Night: 10 PM - 6 AM
          if (hour >= 22 || hour <= 6) {
            return 1.2; // 20% faster
          }
        }
        return 1.0; // Normal speed
      };

      const speedMultiplier = getSpeedMultiplier(travelMode, hour);
      
      // Generate 3 route alternatives
      const routeVariants = [];
      
      // Route 1: Fastest/Direct (minimal deviation)
      const route1 = generateRealisticRoute(originLoc, destLoc, travelMode, 0.002, speedMultiplier);
      routeVariants.push({
        ...route1,
        name: "Fastest",
        description: `Via main roads • ${getTrafficCondition(hour)}`,
        type: "fastest"
      });
      
      // Route 2: Alternative (moderate deviation)
      const route2 = generateRealisticRoute(originLoc, destLoc, travelMode, -0.006, speedMultiplier * 1.1);
      routeVariants.push({
        ...route2,
        name: "Alternative",
        description: "Avoid tolls and highways",
        type: "alternative"
      });
      
      // Route 3: Scenic/Safest (more deviation, through populated areas)
      const route3 = generateRealisticRoute(originLoc, destLoc, travelMode, 0.004, speedMultiplier * 1.15);
      
      // Analyze safety for route 3
      const safetyAnalysis = analyzeRouteSafety(route3.coordinates, safetyReports);
      
      routeVariants.push({
        ...route3,
        name: safetyAnalysis.score >= 75 ? "Safest" : "Scenic",
        description: safetyAnalysis.score >= 75 ? "Well-lit, populated areas" : "Through parks and main streets",
        type: "safest",
        safetyScore: safetyAnalysis.score,
        safetyAnalysis: safetyAnalysis
      });

      setRoutes(routeVariants);
      setSelectedRouteIndex(0);
      setStatusMessage(`${routeVariants.length} routes found`);
      
      setTimeout(() => setStatusMessage(""), 2000);
      toast.success("Routes calculated");
    } catch (error) {
      console.error("Error calculating route:", error);
      toast.error("Failed to calculate routes");
      setStatusMessage("");
    }
    
    setLoading(false);
  };

  const getTrafficCondition = (hour) => {
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return "Heavy traffic";
    }
    if (hour >= 10 && hour <= 16) {
      return "Light traffic";
    }
    return "Minimal traffic";
  };

  const analyzeRouteSafety = (coordinates, reports) => {
    let safetyIssues = 0;
    let safeSpots = 0;
    
    coordinates.forEach(coord => {
      reports.forEach(report => {
        const distance = calculateDistance(coord[0], coord[1], report.location.lat, report.location.lng);
        
        if (distance < 200) {
          if (report.report_type === 'unsafe_area' || report.report_type === 'harassment' || report.report_type === 'poor_lighting') {
            safetyIssues += (report.severity === 'high' ? 3 : report.severity === 'medium' ? 2 : 1);
          } else if (report.report_type === 'safe_spot' || report.report_type === 'well_lit') {
            safeSpots += 2;
          }
        }
      });
    });
    
    const baseScore = 75;
    const score = Math.max(20, Math.min(100, baseScore + safeSpots * 2 - safetyIssues * 5));
    
    return {
      score,
      safetyIssues,
      safeSpots,
      nearbyReports: reports.filter(r => {
        return coordinates.some(coord => 
          calculateDistance(coord[0], coord[1], r.location.lat, r.location.lng) < 200
        );
      })
    };
  };

  const generateRealisticRoute = (origin, dest, mode, variance, speedMultiplier) => {
    const latDiff = dest.lat - origin.lat;
    const lngDiff = dest.lng - origin.lng;
    const distance = calculateDistance(origin.lat, origin.lng, dest.lat, dest.lng);
    
    // More waypoints for longer routes
    const numSteps = Math.max(8, Math.min(15, Math.floor(distance / 500)));
    
    const coordinates = [];
    const steps = [];
    
    // Generate realistic curved path
    for (let i = 0; i <= numSteps; i++) {
      const progress = i / numSteps;
      
      // Smooth curve with variance
      const curveFactor = Math.sin(progress * Math.PI) * variance;
      
      // Add slight zigzag for realism (following roads)
      const roadOffset = Math.sin(progress * numSteps * 0.8) * 0.0005;
      
      coordinates.push([
        origin.lat + (latDiff * progress) + curveFactor + roadOffset,
        origin.lng + (lngDiff * progress) - curveFactor * 0.7 + roadOffset * 0.5
      ]);
      
      if (i < numSteps) {
        const segment = calculateDistance(
          coordinates[i][0], coordinates[i][1],
          coordinates[i + 1][0], coordinates[i + 1][1]
        );
        
        steps.push({
          instruction: getStepInstruction(i, numSteps, mode),
          distance: segment,
          duration: calculateDuration(segment, mode, speedMultiplier) / numSteps
        });
      }
    }
    
    const totalDistance = distance * (1 + Math.abs(variance) * 2);
    const totalDuration = calculateDuration(totalDistance, mode, speedMultiplier);
    
    return {
      coordinates,
      steps,
      distance: totalDistance,
      duration: totalDuration
    };
  };

  const switchRoute = (index) => {
    setSelectedRouteIndex(index);
    toast.success(`Switched to ${routes[index].name} route`);
  };

  const getStepInstruction = (index, total, mode) => {
    const modeVerb = {
      'DRIVING': 'Drive',
      'WALKING': 'Walk',
      'BICYCLING': 'Bike',
      'TRANSIT': 'Take'
    };
    
    const instructions = [
      `${modeVerb[mode] || 'Head'} northeast on Main St`,
      `Turn right onto 2nd Avenue`,
      `Continue straight for 500m`,
      `Turn left at the intersection`,
      `Keep right at the fork`,
      `Continue onto Bridge Road`,
      `Turn slight left`,
      `Take the 3rd exit at the roundabout`,
      `Turn right onto Park Street`,
      `Continue straight`,
      `Turn left onto Final Ave`,
      `Your destination will be on the right`
    ];
    
    const instructionIndex = Math.floor((index / total) * (instructions.length - 1));
    return instructions[instructionIndex] || "Continue on route";
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
  };

  const calculateDuration = (distanceInMeters, mode, speedMultiplier = 1) => {
    const baseSpeedKmh = {
      'DRIVING': 50,
      'WALKING': 5,
      'BICYCLING': 20,
      'TRANSIT': 40
    };
    const speed = (baseSpeedKmh[mode] || 40) * speedMultiplier;
    return (distanceInMeters / 1000) / speed * 3600;
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  const selectedRoute = routes[selectedRouteIndex];
  
  const bounds = originCoords && destinationCoords && 
                 Array.isArray(originCoords) && originCoords.length === 2 &&
                 Array.isArray(destinationCoords) && destinationCoords.length === 2 ? [
    [Math.min(originCoords[0], destinationCoords[0]), Math.min(originCoords[1], destinationCoords[1])],
    [Math.max(originCoords[0], destinationCoords[0]), Math.max(originCoords[1], destinationCoords[1])]
  ] : null;

  const center = (originCoords && Array.isArray(originCoords) && originCoords.length === 2) 
    ? originCoords 
    : [52.3676, 4.9041];

  const canCalculateRoute = !!origin && !!destination && !loading && routes.length === 0;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Map */}
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        <MapController center={center} bounds={bounds} />
        
        {/* Origin Marker */}
        {originCoords && Array.isArray(originCoords) && originCoords.length === 2 && (
          <Marker 
            position={originCoords}
            icon={L.divIcon({
              className: 'custom-origin-marker',
              html: `<div style="background: #4285F4; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          >
            <Popup>
              <div className="text-sm">
                <strong>Start</strong>
                <p>{origin}</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Destination Marker */}
        {destinationCoords && Array.isArray(destinationCoords) && destinationCoords.length === 2 && (
          <Marker 
            position={destinationCoords}
            icon={L.divIcon({
              className: 'custom-destination-marker',
              html: `<div style="background: #EA4335; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          >
            <Popup>
              <div className="text-sm">
                <strong>Destination</strong>
                <p>{destination}</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Selected Route - Thick blue line */}
        {selectedRoute && selectedRoute.coordinates && (
          <Polyline
            positions={selectedRoute.coordinates}
            pathOptions={{
              color: '#4285F4',
              weight: 6,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        )}
        
        {/* Alternative routes - Gray dashed */}
        {routes.map((route, index) => (
          index !== selectedRouteIndex && route.coordinates && (
            <Polyline
              key={index}
              positions={route.coordinates}
              pathOptions={{
                color: '#9CA3AF',
                weight: 4,
                opacity: 0.6,
                dashArray: '10, 10',
                lineCap: 'round',
                lineJoin: 'round'
              }}
              eventHandlers={{
                click: () => switchRoute(index)
              }}
            />
          )
        ))}
      </MapContainer>

      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-[1000] w-full max-w-[380px]">
        <Card className="bg-white shadow-2xl rounded-2xl border-0 overflow-hidden">
          {/* Input Section */}
          <div className="p-4 space-y-3">
            {statusMessage && (
              <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg flex items-center gap-2">
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                {statusMessage}
              </div>
            )}

            {/* Origin */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0" />
                <Input
                  placeholder="Choose start location"
                  value={origin}
                  onChange={(e) => handleOriginChange(e.target.value)}
                  onKeyPress={handleOriginKeyPress}
                  onFocus={() => origin.length > 2 && setShowOriginSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
                  className="h-11 text-sm border-gray-300 focus:border-blue-500 rounded-lg"
                />
                <Button
                  onClick={useMyLocation}
                  disabled={locationLoading}
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                >
                  {locationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Locate className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="absolute top-full left-6 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                  {originSuggestions.map((loc, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectOrigin(loc)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Waypoints */}
            {waypoints.map((waypoint, index) => (
              <div key={index} className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <Input
                  placeholder={`Stop ${index + 1}`}
                  value={waypoint}
                  onChange={(e) => {
                    const newWaypoints = [...waypoints];
                    newWaypoints[index] = e.target.value;
                    setWaypoints(newWaypoints);
                  }}
                  className="h-11 text-sm border-gray-300 focus:border-blue-500 rounded-lg"
                />
                <Button
                  onClick={() => removeWaypoint(index)}
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {/* Destination */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0" />
                <Input
                  placeholder="Choose destination"
                  value={destination}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  onKeyPress={handleDestinationKeyPress}
                  onFocus={() => destination.length > 2 && setShowDestinationSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
                  className="h-11 text-sm border-gray-300 focus:border-blue-500 rounded-lg"
                />
                <Button
                  onClick={swapLocations}
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  disabled={!destination}
                >
                  <Repeat className="w-4 h-4" />
                </Button>
              </div>
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="absolute top-full left-6 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                  {destinationSuggestions.map((loc, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectDestination(loc)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Calculate Route Button - Shows when ready */}
            {canCalculateRoute && routes.length === 0 && (
              <Button
                onClick={handleCalculateRoute}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 mr-2" />
                    Calculate Route
                  </>
                )}
              </Button>
            )}

            {/* Add Waypoint Button */}
            {waypoints.length < 3 && destination && (
              <Button
                onClick={addWaypoint}
                variant="ghost"
                size="sm"
                className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-9"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add stop
              </Button>
            )}

            {/* Travel Mode */}
            <div className="flex gap-2">
              {[
                { value: "DRIVING", icon: "🚗", label: "Drive" },
                { value: "WALKING", icon: "🚶", label: "Walk" },
                { value: "BICYCLING", icon: "🚴", label: "Bike" },
                { value: "TRANSIT", icon: "🚊", label: "Transit" }
              ].map(mode => (
                <Button
                  key={mode.value}
                  onClick={() => setTravelMode(mode.value)}
                  variant={travelMode === mode.value ? "default" : "outline"}
                  className={`flex-1 h-12 rounded-xl ${
                    travelMode === mode.value
                      ? "bg-blue-500 hover:bg-blue-600 text-white border-0"
                      : "border-2 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <span className="text-lg mr-1">{mode.icon}</span>
                  <span className="text-xs font-medium">{mode.label}</span>
                </Button>
              ))}
            </div>

            {/* Action Buttons */}
            {destination && (
              <div className="flex gap-2">
                <Button
                  onClick={clearRoute}
                  variant="outline"
                  className="flex-1 h-10 rounded-xl border-2 border-gray-200"
                >
                  Clear
                </Button>
                {selectedRoute && (
                  <>
                    <Button
                      onClick={copyShareLink}
                      variant="outline"
                      className="h-10 px-3 rounded-xl border-2 border-gray-200"
                    >
                      {linkCopied ? <Check className="w-4 h-4 text-green-600" /> : <LinkIcon className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={() => setShowSafetyPanel(!showSafetyPanel)}
                      variant="outline"
                      className="h-10 px-3 rounded-xl border-2 border-gray-200"
                    >
                      <Shield className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={findAvailableBuddies}
                      className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] hover:from-[#B8A9FF] hover:to-[#9989D8] text-white border-0"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Routes Section */}
          {routes.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="p-4 space-y-3">
                {routes.map((route, index) => (
                  <button
                    key={index}
                    onClick={() => switchRoute(index)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      index === selectedRouteIndex
                        ? "bg-blue-50 border-2 border-blue-500"
                        : "bg-gray-50 border-2 border-transparent hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{route.name}</span>
                      <div className="flex items-center gap-2">
                        {route.type === "safest" && route.safetyScore >= 75 && (
                          <Badge className="bg-green-500 text-white border-0 text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Safe
                          </Badge>
                        )}
                        <span className="font-bold text-gray-900">{formatDistance(route.distance)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>{formatDuration(route.duration)}</span>
                      <span>•</span>
                      <span>{route.description}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Directions */}
              {selectedRoute && (
                <div className="border-t border-gray-200">
                  <button
                    onClick={() => setStepsExpanded(!stepsExpanded)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900 text-sm">
                      Turn-by-turn directions
                    </span>
                    {stepsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {stepsExpanded && (
                    <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
                      {selectedRoute.steps.map((step, index) => (
                        <div key={index} className="flex gap-3 text-sm">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-700">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900 leading-snug">{step.instruction}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDistance(step.distance)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Safety Panel */}
      {showSafetyPanel && selectedRoute?.safetyAnalysis && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] max-w-md mx-auto">
          <Card className="bg-white shadow-2xl rounded-2xl border-0 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Safety Information
              </h3>
              <Button
                onClick={() => setShowSafetyPanel(false)}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">Safety Score</span>
                <Badge className="bg-green-500 text-white border-0">
                  {selectedRoute.safetyAnalysis.score}/100
                </Badge>
              </div>
              
              {selectedRoute.safetyAnalysis.nearbyReports.length > 0 && (
                <div className="text-xs text-gray-600">
                  <p className="font-medium mb-1">Community Reports:</p>
                  <ul className="space-y-1">
                    {selectedRoute.safetyAnalysis.nearbyReports.slice(0, 3).map((report, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{report.report_type.replace(/_/g, ' ')} near {report.location.address}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Buddy Request Modal */}
      {showBuddyRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
          <Card className="bg-white rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-br from-[#C7B8FF] to-[#A99EE8] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-7 h-7" />
                  Request a Buddy
                </h3>
                <Button
                  onClick={() => setShowBuddyRequest(false)}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{origin} → {destination}</span>
                </div>
                <p className="text-xs text-gray-600">
                  Available buddies near your route:
                </p>
              </div>

              <div className="space-y-3">
                {availableBuddies.map((buddy) => (
                  <div key={buddy.id} className="p-4 bg-gradient-to-br from-[#F5F2FF] to-white rounded-2xl border border-[#E5DFFF]">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#C7B8FF] to-[#A99EE8] rounded-full flex items-center justify-center text-white font-bold">
                        {buddy.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900">{buddy.name}</h4>
                          {buddy.verified && <span className="text-blue-500 text-sm">✓</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{buddy.rating}</span>
                          <span>•</span>
                          <span>{buddy.trips} trips</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        <p>{buddy.route}</p>
                        <p className="text-green-600 font-medium">{buddy.distance}</p>
                      </div>
                      <Button
                        onClick={() => sendBuddyRequest(buddy)}
                        disabled={requestBuddyMutation.isPending}
                        size="sm"
                        className="rounded-full bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] hover:from-[#B8A9FF] hover:to-[#9989D8] text-white text-xs h-8 px-4"
                      >
                        {requestBuddyMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Bell className="w-3 h-3 mr-1" />
                            Request
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}

                {availableBuddies.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No available buddies nearby right now</p>
                    <p className="text-xs text-gray-500 mt-1">Try again later or adjust your route</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {showChat && selectedBuddy && currentUser && (
        <ChatModal
          buddy={selectedBuddy}
          currentUser={currentUser}
          onClose={() => {
            setShowChat(false);
            setSelectedBuddy(null);
          }}
        />
      )}
    </div>
  );
}
