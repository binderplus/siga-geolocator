SELECT
       [Ventas].[Fecha]
      ,[Ventas].[IdTipoComprobante]
      ,[Ventas].[SubTotal]
      ,[Ventas].[DescuentoRecargo]
      ,[Ventas].[ImporteTotal]
      ,[Ventas].[NroDocCliente]
      ,[Clientes].[NombreCliente]
      
FROM [SIGA].[dbo].[Ventas] 
JOIN [SIGA].[dbo].[Clientes] ON ([dbo].[Ventas].[NroDocCliente] = [dbo].[Clientes].[NroDocumento])
WHERE ([Ventas].[IdTipoComprobante] = 'COTIZACION' OR [Ventas].[IdTipoComprobante] = 'FACT')
AND (DATEDIFF(year, [Ventas].[Fecha], CURRENT_TIMESTAMP) = 0)
ORDER BY [Fecha] DESC