
import React, { useEffect, useState } from 'react';
import { InvokeLLM } from "@/api/integrations";
import { Asset } from "@/api/entities";
import { Loader2 } from "lucide-react";

const priceCache = new Map();
const TASE_API_KEY = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.TESTKEY.TASE1234567"; // Keep test key for now
const isTaseId = (symbol) => /^\d{6,10}$/.test(symbol);
const isPotentialCrypto = (symbol) => /^[A-Z]{3,5}$/.test(symbol) && !isTaseId(symbol); // Simple heuristic

export default function MarketDataFetcher({ symbols, onDataFetched, interval = 300000 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchMarketDataForAllSymbols = async () => {
    if (!symbols || symbols.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    const now = Date.now();
    let allFetchedQuotes = [];

    const yahooSymbols = [];
    const taseIds = [];
    const cryptoSymbols = []; // For CoinGecko

    symbols.forEach(s => {
      const cachedData = priceCache.get(s);
      if (!cachedData || (now - cachedData.timestamp > interval)) {
        if (isTaseId(s)) {
          taseIds.push(s);
        } else if (isPotentialCrypto(s)) { // Check if it might be crypto
          cryptoSymbols.push(s);
        }
         else { // Default to Yahoo
          yahooSymbols.push(s);
        }
      }
    });

    if (yahooSymbols.length > 0) {
      try {
        const yahooSymbolsString = yahooSymbols.join(',');
        const yahooPrompt = `Fetch real-time price data for these symbols: ${yahooSymbolsString} using the Yahoo Finance API.
        API endpoint template: https://yahoo-finance15.p.rapidapi.com/api/yahoo/qu/quote/SYMBOL (replace SYMBOL with each actual symbol).
        Use these exact headers for each API call:
        x-rapidapi-key: 3f10613752mshabab37924961ffap1186a4jsn19b802b7c7f4
        x-rapidapi-host: yahoo-finance15.p.rapidapi.com
        
        For each symbol, the API response is an array containing one object. From this object, extract:
        - 'symbol': The stock symbol.
        - 'name': From 'shortName' or 'longName'. If both missing, use symbol.
        - 'price': Must be 'regularMarketPrice'. If missing/invalid, set to null.
        - 'change_percent': Must be 'regularMarketChangePercent'. If missing/invalid, set to null.
        
        Return JSON: { "quotes": [{ "symbol": "string", "name": "string", "price": number|null, "change_percent": number|null }] }
        Omit symbols with API errors or missing 'regularMarketPrice'/'regularMarketChangePercent'.`;
        
        const yahooResponse = await InvokeLLM({
          prompt: yahooPrompt,
          add_context_from_internet: true, 
          response_json_schema: {
            type: "object",
            properties: {
              quotes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    symbol: { type: "string" },
                    name: { type: "string" },
                    price: { type: ["number", "null"] },
                    change_percent: { type: ["number", "null"] }
                  },
                  required: ["symbol", "name"]
                }
              }
            },
            required: ["quotes"]
          }
        });
        if (yahooResponse?.quotes) {
          allFetchedQuotes = allFetchedQuotes.concat(yahooResponse.quotes.map(q => ({...q, source: 'yahoo'})));
        }
      } catch (err) {
        console.error("Error fetching Yahoo market data:", err);
        setError(prev => prev ? `${prev}, Yahoo fetch failed` : "Yahoo fetch failed");
      }
    }

    if (taseIds.length > 0) {
      try {
        const taseIdsString = taseIds.join(',');
        const tasePrompt = `For each TASE instrument ID in this list: ${taseIdsString}:
        1. Make a GET request to: https://api.tase.co.il/api/quote/GetQuoteById?id=INSTRUMENT_ID (replace INSTRUMENT_ID).
        2. Use this exact HTTP header: Authorization: ${TASE_API_KEY}
        3. From the JSON response, extract:
           - 'instrumentId': as 'symbol' (this should be the original numeric ID string).
           - 'lastPrice': as 'price'. If missing/invalid, set to null.
           - 'priceChangePercent': as 'change_percent'. If missing/invalid, set to null.
           - 'name': (Optional, if available in response, e.g., from a field like 'instrumentName' or 'shortName'. If not, use the ID as name).
        
        Return all results as a JSON array: { "quotes": [{ "symbol": "string", "name": "string", "price": number|null, "change_percent": number|null }] }
        If an API call for a specific ID fails or data is missing, include it with nulls for price/change_percent.`;
        
        const taseResponse = await InvokeLLM({
          prompt: tasePrompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              quotes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    symbol: { type: "string" }, 
                    name: { type: "string" },
                    price: { type: ["number", "null"] },
                    change_percent: { type: ["number", "null"] }
                  },
                  required: ["symbol", "name"]
                }
              }
            },
            required: ["quotes"]
          }
        });
        if (taseResponse?.quotes) {
          allFetchedQuotes = allFetchedQuotes.concat(taseResponse.quotes.map(q => ({...q, source: 'tase'})));
        }
      } catch (err) {
        console.error("Error fetching TASE market data:", err);
        setError(prev => prev ? `${prev}, TASE fetch failed` : "TASE fetch failed");
      }
    }

    // Fetch data for Crypto symbols from CoinGecko
    if (cryptoSymbols.length > 0) {
      try {
        const cryptoSymbolsString = cryptoSymbols.join(',');
        // LLM needs to map symbol (e.g. BTC) to CoinGecko ID (e.g. bitcoin)
        const cryptoPrompt = `For each cryptocurrency symbol in this list: ${cryptoSymbolsString}:
        1. Determine its corresponding 'id' used by the CoinGecko API (e.g., for 'BTC', the id is 'bitcoin'; for 'ETH', it's 'ethereum').
        2. Once you have the CoinGecko id, make a GET request to: https://api.coingecko.com/api/v3/simple/price?ids=COINGECKO_ID&vs_currencies=usd (replace COINGECKO_ID).
        3. From the JSON response (e.g., {"bitcoin":{"usd":60000}}), extract the price in USD.
        4. The 'name' should be the common name of the cryptocurrency (e.g., Bitcoin).
        
        Return all results as a JSON array: { "quotes": [{ "symbol": "ORIGINAL_USER_SYMBOL", "name": "string", "price": number|null, "change_percent": null }] }
        Note: CoinGecko simple price endpoint doesn't usually provide daily change percent, so 'change_percent' should be null.
        If a symbol cannot be mapped to a CoinGecko ID or price fetching fails, include it with null for price.`;

        const cryptoResponse = await InvokeLLM({
          prompt: cryptoPrompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              quotes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    symbol: { type: "string" }, // Original user symbol
                    name: { type: "string" },
                    price: { type: ["number", "null"] }, // Price in USD
                    change_percent: { type: ["null"], default: null } // Explicitly null
                  },
                  required: ["symbol", "name"]
                }
              }
            },
            required: ["quotes"]
          }
        });
        if (cryptoResponse?.quotes) {
          allFetchedQuotes = allFetchedQuotes.concat(cryptoResponse.quotes.map(q => ({...q, source: 'coingecko', currency: 'USD' }))); // Assuming USD for now
        }
      } catch (err) {
        console.error("Error fetching CoinGecko market data:", err);
        setError(prev => prev ? `${prev}, CoinGecko fetch failed` : "CoinGecko fetch failed");
      }
    }

    const currentTimestamp = Date.now();
    allFetchedQuotes.forEach(quote => {
      priceCache.set(quote.symbol, {
        data: quote, 
        timestamp: currentTimestamp
      });
    });

    const finalResultsForUpdate = symbols.map(symbol => {
      const cachedItem = priceCache.get(symbol);
      if (cachedItem) { 
        return cachedItem.data;
      }
      return null; 
    }).filter(Boolean); 
    
    if (finalResultsForUpdate.length > 0) {
      for (const quote of finalResultsForUpdate) {
        const assetsToUpdate = await Asset.filter({ symbol: quote.symbol, update_method: 'automatic' }); // Only update 'automatic' ones
        for (const asset of assetsToUpdate) {
          await Asset.update(asset.id, {
            current_unit_price: quote.price, // Store fetched unit price
            daily_change_percent: quote.change_percent,
            // The main 'currency' of the asset is defined by user.
            // If fetched currency (e.g. USD for crypto) is different, conversion would be needed for 'current_value'.
            // For simplicity, 'current_value' for 'automatic' assets will be quantity * current_unit_price (assuming current_unit_price is in asset's main currency or converted)
            // This is complex: for now, current_unit_price is stored. AssetCard can display it with its original currency.
            // The `current_value` field in Asset entity for auto assets should be updated based on current_unit_price * quantity
            current_value: asset.quantity * (quote.price || 0), // Update current_value based on fetched price
            name: quote.name || asset.description, // Update name if fetched
            last_updated_manual: new Date().toISOString() // Represents last successful fetch
          });
        }
      }
      onDataFetched(finalResultsForUpdate); // This signals that new data MIGHT be available. Parent reloads from DB.
    } else if (symbols.length > 0 && (yahooSymbols.length > 0 || taseIds.length > 0 || cryptoSymbols.length > 0) && !error) {
      setError("No valid market data returned from APIs for new requests.");
    }
    
    setLoading(false);
  };
  
  useEffect(() => {
    fetchMarketDataForAllSymbols();
    const intervalId = setInterval(fetchMarketDataForAllSymbols, interval);
    return () => clearInterval(intervalId);
  }, [JSON.stringify(symbols), interval]);
  
  return (
    <div className="market-data-fetcher hidden"> {/* Can be hidden as it's a background task */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-md text-xs flex items-center shadow-lg">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          מעדכן מחירים...
        </div>
      )}
      {error && <div className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-md text-xs shadow-lg">שגיאה: {error}</div>}
    </div>
  );
}
