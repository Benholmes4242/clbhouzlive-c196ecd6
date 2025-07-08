
import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import Top100ExplorerContent from '@/components/explorer/Top100ExplorerContent';

const Top100Explorer = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Top 100 Explorer</h1>
            <p className="text-gray-600">Follow the Clbhouz Community Through the World's Top 100 Courses</p>
          </div>
          
          <Top100ExplorerContent />
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Top100Explorer;
