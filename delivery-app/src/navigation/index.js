import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../store/auth';
import { colors } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ActiveOrderScreen from '../screens/ActiveOrderScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrderOfferLayer from '../components/OrderOfferLayer';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  HomeTab: { active: 'home', inactive: 'home-outline', lib: 'ion' },
  ActiveTab: { active: 'motorbike', inactive: 'motorbike', lib: 'mci' },
  History: { active: 'bar-chart', inactive: 'bar-chart-outline', lib: 'ion' },
  Profile: { active: 'person', inactive: 'person-outline', lib: 'ion' },
};

function renderTabIcon(name, color, focused) {
  const set = TAB_ICONS[name];
  const iconName = focused ? set.active : set.inactive;
  if (set.lib === 'mci') return <MaterialCommunityIcons name={iconName} size={24} color={color} />;
  return <Ionicons name={iconName} size={24} color={color} />;
}

function MainTabs() {
  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            borderTopColor: colors.border,
            paddingTop: 8,
            paddingBottom: 10,
            height: 68,
            backgroundColor: '#fff',
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
          tabBarIcon: ({ color, focused }) => renderTabIcon(route.name, color, focused),
        })}
      >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="ActiveTab" component={ActiveOrderScreen} options={{ title: 'Active' }} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
      <OrderOfferLayer />
    </>
  );
}

export default function RootNavigation() {
  const user = useAuth((s) => s.user);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={MainTabs} />
            <Stack.Screen
              name="ActiveOrder"
              component={ActiveOrderScreen}
              options={{ headerShown: true, title: 'Active Order' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
