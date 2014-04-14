SELECT
	 [Clientes].NroDocumento
	,[Clientes].NombreCliente
	,[Clientes].Direccion
	,[Localidades].NombreLocalidad
	,LEFT([Localidades].IdLocalidad,4) AS CodigoPostal
	,[Provincias].NombreProvincia
	,[Clientes].Telefono
	,[Clientes].Celular
	,[Empleados].NombreEmpleado AS Vendedor
	,[Clientes].Activo
	,(	SELECT TOP 1 [Ventas].[Fecha]
		FROM [Ventas]
		WHERE ([Ventas].[NroDocCliente] = [Clientes].NroDocumento)
		AND ([Ventas].[IdTipoComprobante] = 'COTIZACION' OR [Ventas].[IdTipoComprobante] = 'FACT')
		ORDER BY [Ventas].Fecha DESC
	) AS UltimaVenta
	,(	SELECT SUM([Ventas].[ImporteTotal])
		FROM [Ventas]
		WHERE ([Ventas].[NroDocCliente] = [Clientes].NroDocumento)
		AND ([Ventas].[IdTipoComprobante] = 'COTIZACION' OR [Ventas].[IdTipoComprobante] = 'FACT')
		AND ([Ventas].Fecha > DATEADD(YEAR, -1, GETDATE()))
	) AS VentaUltimoAno

FROM [Clientes]
LEFT JOIN [Localidades] ON ([Clientes].IdLocalidad		= [Localidades].IdLocalidad)
LEFT JOIN [Provincias]  ON ([Localidades].IdProvincia	= [Provincias].IdProvincia)
LEFT JOIN [Empleados]	ON ([Clientes].NroDocVendedor	= [Empleados].NroDocEmpleado)
ORDER BY UltimaVenta DESC