/**
 * useProductPricing — Fetches configurable product pricing from the database.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductPrice {
  id: string;
  product_key: string;
  display_name: string;
  description: string | null;
  price_cents: number;
  category: string;
  is_active: boolean;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
}

export function useProductPricing() {
  return useQuery({
    queryKey: ["product-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_pricing")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("price_cents");
      if (error) throw error;
      return (data || []) as ProductPrice[];
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

export function useProductPrice(productKey: string) {
  const { data: prices, isLoading } = useProductPricing();
  const product = prices?.find(p => p.product_key === productKey);
  return {
    price: product ? product.price_cents / 100 : null,
    priceCents: product?.price_cents ?? null,
    displayName: product?.display_name ?? productKey,
    description: product?.description ?? null,
    stripeId: product?.stripe_price_id ?? null,
    isLoading,
    product,
  };
}
