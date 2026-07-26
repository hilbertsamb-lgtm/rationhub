import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  path: string | null | undefined;
}

async function signedUrl(path: string) {
  const { data, error } = await supabase.storage
    .from("products")
    .createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export function ProductImage({ path, className, alt = "", ...rest }: Props) {
  const { data } = useQuery({
    queryKey: ["product-image", path],
    queryFn: () => signedUrl(path as string),
    enabled: !!path,
    staleTime: 55 * 60 * 1000,
  });

  if (!path || !data) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-xs text-muted-foreground",
          className,
        )}
      >
        No image
      </div>
    );
  }
  return <img src={data} alt={alt} className={className} {...rest} />;
}
