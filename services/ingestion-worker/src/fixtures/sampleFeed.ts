export const SAMPLE_RSS_FEED = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:commutenest="https://commutenest.local/schema">
  <channel>
    <title>CommuteNest Fixture Listings</title>
    <link>https://example.test/listings</link>
    <description>Fixture feed for local ingestion proof of concept.</description>

    <item>
      <title>$1,650 bright studio near downtown</title>
      <link>https://example.test/listings/bright-studio</link>
      <guid isPermaLink="false">fixture-bright-studio</guid>
      <pubDate>Sat, 12 Sep 2026 13:00:00 GMT</pubDate>
      <description><![CDATA[Address: 100 King Street West, Toronto, ON. Sunny studio close to subway and groceries.]]></description>
      <commutenest:price currency="USD">1650</commutenest:price>
      <commutenest:address>100 King Street West, Toronto, ON</commutenest:address>
    </item>

    <item>
      <title>$1,775 renovated one bedroom near Bloor</title>
      <link>https://example.test/listings/bloor-one-bedroom</link>
      <guid isPermaLink="false">fixture-bloor-one-bedroom</guid>
      <pubDate>Sat, 12 Sep 2026 13:05:00 GMT</pubDate>
      <description><![CDATA[Address: 700 Bloor Street West, Toronto, ON. Renovated one bedroom with laundry nearby.]]></description>
      <commutenest:price currency="USD">1775</commutenest:price>
      <commutenest:address>700 Bloor Street West, Toronto, ON</commutenest:address>
    </item>

    <item>
      <title>$1,700 large room in Scarborough</title>
      <link>https://example.test/listings/scarborough-room</link>
      <guid isPermaLink="false">fixture-scarborough-room</guid>
      <pubDate>Sat, 12 Sep 2026 13:10:00 GMT</pubDate>
      <description><![CDATA[Address: 300 Borough Drive, Scarborough, ON. Large furnished room in shared unit.]]></description>
      <commutenest:price currency="USD">1700</commutenest:price>
      <commutenest:address>300 Borough Drive, Scarborough, ON</commutenest:address>
    </item>

    <item>
      <title>$2,400 premium condo by Queens Quay</title>
      <link>https://example.test/listings/queens-quay-condo</link>
      <guid isPermaLink="false">fixture-queens-quay-condo</guid>
      <pubDate>Sat, 12 Sep 2026 13:15:00 GMT</pubDate>
      <description><![CDATA[Address: 10 Queens Quay West, Toronto, ON. Premium waterfront condo with gym access.]]></description>
      <commutenest:price currency="USD">2400</commutenest:price>
      <commutenest:address>10 Queens Quay West, Toronto, ON</commutenest:address>
    </item>
  </channel>
</rss>
`;

