import Image from "next/image";

type Props = {
  image: string;
  name: string;
};

export default function ProductImage({
  image,
  name,
}: Props) {
  return (
    <div className="relative h-96 w-full overflow-hidden rounded-xl">
      <Image
        src={image}
        alt={name}
        fill
        priority
        className="object-cover"
      />
    </div>
  );
}