"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

import Image from "next/image";
import SignInPage from "./signin/page";
import PersonnelPage from "./personnel/page";
export default function Home() {
    const router = useRouter();
  
    useEffect(() => {
       router.push('/signin');
  }, [router]);
 
  return (
    <div>
    Loading Page...
    Please stand by!</div>
  );
}
