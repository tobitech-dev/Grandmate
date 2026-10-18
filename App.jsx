import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { MeContext } from './lib/me';
import { currentSeason, rolloverSeason } from './lib/season';
import Login from './pages/Login.jsx';
import ChooseName from './pages/ChooseName.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PlayAI from './pages/PlayAI.jsx';
import PlayOnline from './pages/PlayOnline.jsx';
import Shop from './pages/Shop.jsx';
import Profile from './pages/Profile.jsx';
import Search from './pages/Search.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import CoinBadge from './components/CoinBadge.jsx';
import RankBadge from './components/RankBadge.jsx';

export default function App() {
  const [user, setUser] = useState(undefined);
  const [me, setMe] = useState(undefined);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setMe(u ? undefined : null);
      }),
    []
  );

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), (s) => setMe(s.exists() ? s.data() : null));
  }, [user]);

  const rolled = useRef(false);
  useEffect(() => {
    if (user && me && me.season !== currentSeason() && !rolled.current) {
      rolled.current = true;
      rolloverSeason(user.uid, me);
    }
  }, [user, me]);

  if (user === undefined || (user && me === undefined)) return <div className="center">Loading…</div>;
  if (!user) return <Login />;
  if (!me) return <ChooseName uid={user.uid} />;

  return (
    <MeContext.Provider value={{ uid: user.uid, me }}>
      <header>
        <strong className="logo">Chess Arena</strong>
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/online">Online</NavLink>
          <NavLink to="/play">Computer</NavLink>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/ranks">Ranks</NavLink>
          <NavLink to="/search">Search</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
        <RankBadge rp={me.rankPoints} games={me.games} />
        <CoinBadge coins={me.coins} />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/play" element={<PlayAI />} />
          <Route path="/online" element={<PlayOnline />} />
          <Route path="/online/:id" element={<PlayOnline />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/search" element={<Search />} />
          <Route path="/ranks" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </MeContext.Provider>
  );
}
