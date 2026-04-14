import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RecommendationCardProps {
  title: string
  description: string
}

export default function RecommendationCard({ title, description }: RecommendationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
